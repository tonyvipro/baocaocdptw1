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
        return auth()->user() ?? auth('sanctum')->user() ?? User::where('role_id', 1)->first();
    }

    /**
     * Danh sách hợp đồng kèm số lượng tài liệu (cho màn hình Quản lý tài liệu)
     * GET /api/contract-documents
     */
    public function index(ContractDocumentFilterRequest $request): JsonResponse
    {
        $user = $this->getAuthUser();
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('viewAny', ContractDocument::class);

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
    public function indexByContract(Request $request, $contractId): JsonResponse
    {
        if (!is_numeric($contractId) || intval($contractId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $user = $this->getAuthUser();
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('viewAny', ContractDocument::class);

        $documentType = $request->has('document_type') ? (int)$request->input('document_type') : null;
        $documents = $this->documentService->getDocumentsByContract((int) $contractId, $documentType);

        return response()->json([
            'success' => true,
            'data' => ContractDocumentResource::collection($documents),
        ]);
    }

    /**
     * Tải lên tài liệu mới cho hợp đồng
     * POST /api/contracts/{contract}/documents
     */
    public function store(UploadContractDocumentsRequest $request, $contractId): JsonResponse
    {
        if (!is_numeric($contractId) || intval($contractId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $user = $this->getAuthUser();
        $contract = Contract::findOrFail((int) $contractId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('upload', [ContractDocument::class, $contract]);

        try {
            $files = $request->file('files');
            if (!$files && $request->hasFile('file')) {
                $files = [$request->file('file')];
            }
            $result = $this->documentService->uploadDocuments((int) $contractId, $files, $request->validated(), $user);

            return response()->json([
                'success' => true,
                'data' => ContractDocumentResource::collection($result['documents']),
                'warnings' => $result['warnings'],
                'message' => 'Tải lên tài liệu hợp đồng đính kèm thành công!',
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
    public function show($documentId): JsonResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail((int) $documentId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('view', $document);

        return response()->json([
            'success' => true,
            'data' => new ContractDocumentResource($document),
        ]);
    }

    /**
     * Xem trước file (stream inline)
     * GET /api/contract-documents/{document}/preview
     */
    public function preview($documentId): StreamedResponse|BinaryFileResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            abort(404);
        }

        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail((int) $documentId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('view', $document);

        return $this->documentService->previewDocument((int) $documentId, $user);
    }

    /**
     * Tải về file (attachment stream)
     * GET /api/contract-documents/{document}/download
     */
    public function download($documentId): StreamedResponse|BinaryFileResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            abort(404);
        }

        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail((int) $documentId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('download', $document);

        return $this->documentService->downloadDocument((int) $documentId, $user);
    }

    /**
     * Cập nhật thông tin hiển thị metadata của tài liệu
     * PUT /api/contract-documents/{document}
     */
    public function update(UpdateContractDocumentRequest $request, $documentId): JsonResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail((int) $documentId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('update', $document);

        $updated = $this->documentService->updateDocument((int) $documentId, $request->validated(), $user);

        return response()->json([
            'success' => true,
            'data' => new ContractDocumentResource($updated),
            'message' => 'Cập nhật tài liệu hợp đồng thành công!',
        ]);
    }

    /**
     * Xóa mềm tài liệu hợp đồng
     * DELETE /api/contract-documents/{document}
     */
    public function destroy($documentId): JsonResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        $user = $this->getAuthUser();
        $document = $this->documentService->getDocumentDetail((int) $documentId);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('delete', $document);

        try {
            $this->documentService->deleteDocument((int) $documentId, $user);

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
