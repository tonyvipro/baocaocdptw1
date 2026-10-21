<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractExtensionDraftRequest;
use App\Http\Requests\UpdateContractExtensionDraftRequest;
use App\Http\Requests\SubmitContractExtensionRequest;
use App\Http\Requests\RejectContractExtensionRequest;
use App\Http\Requests\UploadExtensionDocumentRequest;
use App\Http\Resources\ContractExtensionResource;
use App\Models\Contract;
use App\Models\ContractExtension;
use App\Models\User;
use App\Services\ContractExtensionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractExtensionController extends Controller
{
    protected ContractExtensionService $extensionService;

    public function __construct(ContractExtensionService $extensionService)
    {
        $this->extensionService = $extensionService;
    }

    protected function getAuthUser(): User
    {
        return auth('sanctum')->user() ?? auth()->user() ?? User::where('role_id', 1)->first();
    }

    /**
     * Lấy lịch sử gia hạn của 1 hợp đồng
     * GET /api/contracts/{contract}/extensions
     */
    public function indexByContract(Request $request, int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $this->authorize('viewAny', ContractExtension::class);

        $perPage = (int)$request->input('per_page', 15);
        $extensions = $this->extensionService->getHistory($contractId, $perPage);

        return response()->json([
            'success' => true,
            'data' => ContractExtensionResource::collection($extensions->items()),
            'meta' => [
                'current_page' => $extensions->currentPage(),
                'last_page' => $extensions->lastPage(),
                'total' => $extensions->total(),
            ]
        ]);
    }

    /**
     * Kiểm tra điều kiện đủ để gia hạn hợp đồng
     * GET /api/contracts/{contract}/extension-eligibility
     */
    public function checkEligibility(int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $this->authorize('viewAny', ContractExtension::class);

        $eligibility = $this->extensionService->checkEligibility($contractId);

        return response()->json([
            'success' => true,
            'data' => $eligibility
        ]);
    }

    /**
     * Lấy bản nháp gia hạn hiện có của hợp đồng (nếu có)
     * GET /api/contracts/{contract}/extension-draft
     */
    public function getDraft(int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $this->authorize('viewAny', ContractExtension::class);

        $draft = $this->extensionService->getDraft($contractId);
        if (!$draft) {
            return response()->json([
                'success' => false,
                'message' => 'Hợp đồng này chưa có bản nháp gia hạn nào.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ContractExtensionResource($draft)
        ]);
    }

    /**
     * Lưu bản nháp gia hạn mới (status = 0)
     * POST /api/contracts/{contract}/extensions
     */
    public function storeDraft(StoreContractExtensionDraftRequest $request, int $contractId): JsonResponse
    {
        $user = $this->getAuthUser();
        $contract = Contract::findOrFail($contractId);
        $this->authorize('create', [ContractExtension::class, $contract]);

        $extension = $this->extensionService->saveDraft($contractId, $request->validated(), $user);

        return response()->json([
            'success' => true,
            'message' => 'Đã lưu bản nháp gia hạn thành công.',
            'data' => new ContractExtensionResource($extension)
        ], 201);
    }

    /**
     * Sửa nội dung bản nháp
     * PUT /api/contract-extensions/{extension}
     */
    public function updateDraft(UpdateContractExtensionDraftRequest $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with('contract')->findOrFail($id);
        $this->authorize('update', $extension);

        $updated = $this->extensionService->updateDraft($extension, $request->validated(), $user);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bản nháp gia hạn thành công.',
            'data' => new ContractExtensionResource($updated)
        ]);
    }

    /**
     * Gửi yêu cầu gia hạn lên cấp trên duyệt (status: 0 -> 1)
     * POST /api/contract-extensions/{extension}/submit
     */
    public function submit(SubmitContractExtensionRequest $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with(['contract', 'documents'])->findOrFail($id);
        $this->authorize('submit', $extension);

        $submitted = $this->extensionService->submit($extension, $request->validated(), $user);

        return response()->json([
            'success' => true,
            'message' => 'Gửi yêu cầu gia hạn hợp đồng thành công! Đang chờ cấp trên phê duyệt.',
            'data' => new ContractExtensionResource($submitted)
        ]);
    }

    /**
     * Phê duyệt yêu cầu gia hạn (status: 1 -> 2)
     * POST /api/contract-extensions/{extension}/approve
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with(['contract', 'creator'])->findOrFail($id);
        $this->authorize('approve', $extension);

        $approved = $this->extensionService->approve($extension, $user);

        return response()->json([
            'success' => true,
            'message' => 'Phê duyệt gia hạn hợp đồng thành công! Hợp đồng đã được cập nhật hiệu lực mới.',
            'data' => new ContractExtensionResource($approved)
        ]);
    }

    /**
     * Từ chối yêu cầu gia hạn (status: 1 -> 3)
     * POST /api/contract-extensions/{extension}/reject
     */
    public function reject(RejectContractExtensionRequest $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with(['contract', 'creator'])->findOrFail($id);
        $this->authorize('reject', $extension);

        $rejected = $this->extensionService->reject($extension, $request->validated()['reject_reason'], $user);

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối yêu cầu gia hạn hợp đồng.',
            'data' => new ContractExtensionResource($rejected)
        ]);
    }

    /**
     * Hủy/rút lại yêu cầu gia hạn
     * POST /api/contract-extensions/{extension}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with('contract')->findOrFail($id);
        $this->authorize('cancel', $extension);

        $cancelled = $this->extensionService->cancel($extension, $user);

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy yêu cầu gia hạn hợp đồng thành công.',
            'data' => new ContractExtensionResource($cancelled)
        ]);
    }

    /**
     * Xóa bản nháp gia hạn (chỉ status = 0)
     * DELETE /api/contract-extensions/{extension}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::findOrFail($id);
        $this->authorize('delete', $extension);

        $this->extensionService->deleteDraft($extension, $user);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bản nháp gia hạn thành công.'
        ]);
    }

    /**
     * Tải lên tài liệu đính kèm phụ lục
     * POST /api/contract-extensions/{extension}/documents
     */
    public function uploadDocuments(UploadExtensionDocumentRequest $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with('contract')->findOrFail($id);
        $this->authorize('uploadDocument', $extension);

        $docs = $this->extensionService->uploadDocuments($extension, $request->file('files'), $user);

        return response()->json([
            'success' => true,
            'message' => 'Tải lên tài liệu phụ lục thành công.',
            'data' => $docs
        ], 201);
    }

    /**
     * Xóa tài liệu đính kèm
     * DELETE /api/contract-extensions/{extension}/documents/{document}
     */
    public function destroyDocument(int $id, int $documentId): JsonResponse
    {
        $user = $this->getAuthUser();
        $extension = ContractExtension::with('contract')->findOrFail($id);
        $this->authorize('uploadDocument', $extension);

        $this->extensionService->deleteDocument($extension, $documentId, $user);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tài liệu đính kèm thành công.'
        ]);
    }

    /**
     * Danh sách tất cả yêu cầu gia hạn dành cho Admin
     * GET /api/contract-extensions
     */
    public function indexAll(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $this->authorize('viewAny', ContractExtension::class);

        $filters = [
            'status' => $request->input('status'),
            'search' => $request->input('search'),
        ];
        $perPage = (int)$request->input('per_page', 15);

        $extensions = $this->extensionService->getAllExtensions($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => ContractExtensionResource::collection($extensions->items()),
            'meta' => [
                'current_page' => $extensions->currentPage(),
                'last_page' => $extensions->lastPage(),
                'total' => $extensions->total(),
            ]
        ]);
    }
}
