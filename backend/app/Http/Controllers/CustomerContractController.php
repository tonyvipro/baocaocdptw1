<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerContractDocumentResource;
use App\Http\Resources\CustomerContractResource;
use App\Models\ContractDocument;
use App\Models\User;
use App\Services\ContractDocumentService;
use App\Services\CustomerContractService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerContractController extends Controller
{
    protected CustomerContractService $customerService;
    protected ContractDocumentService $documentService;

    public function __construct(
        CustomerContractService $customerService,
        ContractDocumentService $documentService
    ) {
        $this->customerService = $customerService;
        $this->documentService = $documentService;
    }

    protected function getAuthCustomer(): User
    {
        $user = auth('sanctum')->user() ?? auth()->user();
        if (!$user) {
            abort(401, 'Vui lòng đăng nhập để truy cập hợp đồng của bạn.');
        }
        return $user;
    }

    /**
     * Danh sách hợp đồng của khách hàng đang đăng nhập
     * GET /api/my/contracts
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->has('page')) {
            $page = $request->query('page');
            if (!is_numeric($page) || intval($page) <= 0 || (string) intval($page) !== (string) $page) {
                return response()->json([
                    'success' => false,
                    'message' => __('spec_messages.row_10_invalid_url_param'),
                ], 404);
            }
        }

        $customer = $this->getAuthCustomer();
        $perPage = (int)$request->input('per_page', 10);
        $paginator = $this->customerService->getMyContracts($customer, $request->only(['search', 'status']), $perPage);

        return response()->json([
            'success' => true,
            'data' => CustomerContractResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ]);
    }

    /**
     * Chi tiết 1 hợp đồng của khách hàng
     * GET /api/my/contracts/{contract}
     */
    public function show($contractId): JsonResponse
    {
        if (!is_numeric($contractId) || intval($contractId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $customer = $this->getAuthCustomer();
        $contract = $this->customerService->getMyContractDetail((int) $contractId, $customer);

        return response()->json([
            'success' => true,
            'data' => new CustomerContractResource($contract),
        ]);
    }

    /**
     * Danh sách tài liệu hợp đồng mà khách hàng được phép xem ({0, 1, 4})
     * GET /api/my/contracts/{contract}/documents
     */
    public function documents($contractId): JsonResponse
    {
        if (!is_numeric($contractId) || intval($contractId) <= 0) {
            return response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404);
        }

        $customer = $this->getAuthCustomer();
        $docs = $this->customerService->getMyContractDocuments((int) $contractId, $customer);

        return response()->json([
            'success' => true,
            'data' => CustomerContractDocumentResource::collection($docs),
        ]);
    }

    /**
     * Khách hàng xem trước file tài liệu được phép (PDF, ảnh)
     * GET /api/my/contract-documents/{document}/preview
     */
    public function preview($documentId): StreamedResponse|BinaryFileResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            abort(404);
        }

        $customer = $this->getAuthCustomer();
        $document = $this->documentService->getDocumentDetail((int) $documentId);

        // Kiểm tra phân quyền qua Policy (chống IDOR)
        $this->authorize('view', $document);

        return $this->documentService->previewDocument((int) $documentId, $customer);
    }

    /**
     * Khách hàng tải về file tài liệu được phép
     * GET /api/my/contract-documents/{document}/download
     */
    public function download($documentId): StreamedResponse|BinaryFileResponse
    {
        if (!is_numeric($documentId) || intval($documentId) <= 0) {
            abort(404);
        }

        $customer = $this->getAuthCustomer();
        $document = $this->documentService->getDocumentDetail((int) $documentId);

        // Kiểm tra phân quyền qua Policy (chống IDOR)
        $this->authorize('download', $document);

        return $this->documentService->downloadDocument((int) $documentId, $customer);
    }
}
