<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContractDocumentFilterRequest;
use App\Http\Requests\UpdateContractDocumentRequest;
use App\Http\Requests\UploadContractDocumentsRequest;
use App\Http\Resources\ContractDocumentResource;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\User;
use App\Services\ContractDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractDocumentController extends Controller
{
    protected ContractDocumentService $documentService;

    public function __construct(ContractDocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    protected function getAuthUser(): User
    {
        return auth('sanctum')->user() ?? auth()->user() ?? User::where('role_id', 1)->first();
    }

    /**
     * Danh sách hợp đồng kèm số lượng tài liệu (cho màn hình Quản lý tài liệu)
     * GET /api/contract-documents
     */
    public function index(ContractDocumentFilterRequest $request): JsonResponse
    {
        $this->authorize('viewAny', ContractDocument::class);

        $perPage = (int)$request->input('per_page', 15);
        $paginator = $this->documentService->getContractsWithDocumentsCount($request->validated(), $perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }

    /**
     * Danh sách tài liệu của một hợp đồng
     * GET /api/contracts/{contract}/documents
     */
    public function indexByContract(Request $request, int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $this->authorize('viewAny', ContractDocument::class);

        $documentType = $request->has('document_type') ? (int)$request->input('document_type') : null;
        $documents = $this->documentService->getDocumentsByContract($contractId, $documentType);

        return response()->json([
            'success' => true,
            'data' => ContractDocumentResource::collection($documents),
        ]);
    }

    /**
     * Tải lên tài liệu mới cho hợp đồng
     * POST /api/contracts/{contract}/documents
     */
    public function store(UploadContractDocumentsRequest $request, int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $contract = Contract::findOrFail($contractId);
        $this->authorize('upload', [ContractDocument::class, $contract]);

        try {
            $files = $request->file('files');
            $result = $this->documentService->uploadDocuments($contractId, $files, $request->validated(), $user);

            return response()->json([
                'success' => true,
                'data' => ContractDocumentResource::collection($result['documents']),
                'warnings' => $result['warnings'],
                'message' => $result['message'],
            ], 201);
        } catch (\InvalidArgumentException $e) {
            $code = $e->getCode() ?: 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    /**
     * Xem chi tiết metadata của 1 tài liệu
     * GET /api/contract-documents/{document}
     */
    public function show(int $documentId): JsonResponse
    {
        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail($documentId);
        $this->authorize('view', $document);

        return response()->json([
            'success' => true,
            'data' => new ContractDocumentResource($document),
        ]);
    }

    /**
     * Xem trước file (stream inline)
     * GET /api/contract-documents/{document}/preview
     */
    public function preview(int $documentId): StreamedResponse|BinaryFileResponse
    {
        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail($documentId);
        $this->authorize('view', $document);

        return $this->documentService->previewDocument($documentId, $user);
    }

    /**
     * Tải về file (attachment stream)
     * GET /api/contract-documents/{document}/download
     */
    public function download(int $documentId): StreamedResponse|BinaryFileResponse
    {
        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail($documentId);
        $this->authorize('download', $document);

        return $this->documentService->downloadDocument($documentId, $user);
    }

    /**
     * Cập nhật thông tin hiển thị metadata của tài liệu
     * PUT /api/contract-documents/{document}
     */
    public function update(UpdateContractDocumentRequest $request, int $documentId): JsonResponse
    {
        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail($documentId);
        $this->authorize('update', $document);

        $updated = $this->documentService->updateDocument($documentId, $request->validated(), $user);

        return response()->json([
            'success' => true,
            'data' => new ContractDocumentResource($updated),
            'message' => 'Cập nhật thông tin tài liệu thành công.',
        ]);
    }

    /**
     * Xóa mềm tài liệu hợp đồng
     * DELETE /api/contract-documents/{document}
     */
    public function destroy(int $documentId): JsonResponse
    {
        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail($documentId);
        $this->authorize('delete', $document);

        try {
            $this->documentService->deleteDocument($documentId, $user);

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa tài liệu hợp đồng thành công.',
            ]);
        } catch (\InvalidArgumentException $e) {
            $code = $e->getCode() ?: 400;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }
}
