<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Deposit\CollectDepositRequest;
use App\Http\Requests\Deposit\ListDepositRequest;
use App\Http\Requests\Deposit\RefundDepositRequest;
use App\Http\Requests\Deposit\UpdateDepositRequest;
use App\Http\Requests\Deposit\VoidDepositMovementRequest;
use App\Http\Resources\ContractDepositResource;
use App\Http\Resources\DepositMovementResource;
use App\Models\Contract;
use App\Models\ContractDeposit;
use App\Models\Transaction;
use App\Policies\ContractDepositPolicy;
use App\Queries\DepositQuery;
use App\Services\DepositService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepositController extends Controller
{
    public function __construct(
        protected DepositQuery $depositQuery,
        protected DepositService $depositService,
        protected ContractDepositPolicy $policy
    ) {
    }

    /**
     * GET /api/deposits
     * Danh sách quản lý tiền cọc có tìm kiếm, lọc, sắp xếp và phân trang (Hình 44)
     */
    public function index(ListDepositRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$this->policy->viewAny($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập danh sách quản lý tiền cọc.',
            ], 403);
        }

        $filters = $request->validated();
        $paginator = $this->depositQuery->getPaginatedList($filters, $user);

        return response()->json([
            'data' => ContractDepositResource::collection($paginator->getCollection()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    /**
     * GET /api/deposits/summary
     * Số liệu 4 thẻ thống kê tiền cọc (Mục 3.4)
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$this->policy->viewAny($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền xem thống kê tiền cọc.',
            ], 403);
        }

        $summary = $this->depositQuery->getSummary($user);

        return response()->json([
            'data' => $summary,
        ]);
    }

    /**
     * GET /api/deposits/options?mode=collect|refund&search=...
     * Danh sách khoản cọc để chọn trong Modal [GHI NHẬN THANH TOÁN MỚI]
     */
    public function options(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$this->policy->viewAny($user)) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập.',
            ], 403);
        }

        $mode = in_array($request->query('mode'), ['collect', 'refund'], true)
            ? $request->query('mode')
            : 'collect';

        if ($mode === 'refund' && !$this->policy->isAdmin($user) && !config('deposit.broker_can_refund', false)) {
            return response()->json([
                'data' => [],
            ]);
        }

        $search = $request->query('search');
        $items = $this->depositQuery->getOptions($mode, $search, $user, 30);

        return response()->json([
            'data' => ContractDepositResource::collection($items),
        ]);
    }

    /**
     * GET /api/deposits/{deposit}
     * Chi tiết khoản cọc + sổ giao dịch thu/hoàn/khấu trừ + chứng từ hợp đồng
     */
    public function show(Request $request, int $depositId): JsonResponse
    {
        $user = $request->user();
        $deposit = ContractDeposit::with('contract')->find($depositId);

        if (!$deposit) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        if (!$this->policy->view($user, $deposit)) {
            return response()->json([
                'message' => 'Bạn không có quyền xem khoản tiền cọc này.',
            ], 403);
        }

        $fullDeposit = $this->depositQuery->findWithMetrics($deposit->id);

        return response()->json([
            'data' => new ContractDepositResource($fullDeposit),
        ]);
    }

    /**
     * POST /api/deposits/{deposit}/collect
     * Ghi nhận THU TIỀN CỌC (Mục 3.6 - Tab Thu cọc)
     */
    public function collect(CollectDepositRequest $request, int $depositId): JsonResponse
    {
        $user = $request->user();
        $deposit = ContractDeposit::with('contract')->find($depositId);

        if (!$deposit) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        if (!$this->policy->collect($user, $deposit)) {
            return response()->json([
                'message' => 'Bạn không có quyền ghi nhận thu tiền cọc cho hợp đồng này.',
            ], 403);
        }

        $result = $this->depositService->collectDeposit($deposit, $request->validated(), $user);

        return response()->json([
            'message' => $result['message'],
            'data' => [
                'deposit' => new ContractDepositResource($result['deposit']),
                'transaction' => new DepositMovementResource($result['transaction']),
            ],
        ], 201);
    }

    /**
     * POST /api/deposits/{deposit}/refund
     * Ghi nhận HOÀN TRẢ và/hoặc KHẤU TRỪ TIỀN CỌC (Mục 3.6 - Tab Hoàn trả cọc)
     */
    public function refund(RefundDepositRequest $request, int $depositId): JsonResponse
    {
        $user = $request->user();
        $deposit = ContractDeposit::with('contract')->find($depositId);

        if (!$deposit) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        if (!$this->policy->refund($user, $deposit)) {
            return response()->json([
                'message' => 'Chỉ Quản trị viên mới có quyền thực hiện hoàn trả hoặc khấu trừ tiền cọc.',
            ], 403);
        }

        $result = $this->depositService->refundDeposit($deposit, $request->validated(), $user);

        return response()->json([
            'message' => $result['message'],
            'data' => [
                'deposit' => new ContractDepositResource($result['deposit']),
                'transactions' => DepositMovementResource::collection(collect($result['transactions'])),
            ],
        ], 201);
    }

    /**
     * PATCH /api/deposits/{deposit}
     * Chỉnh sửa thông tin tiền cọc (Mục 3.7b)
     */
    public function update(UpdateDepositRequest $request, int $depositId): JsonResponse
    {
        $user = $request->user();
        $deposit = ContractDeposit::with('contract')->find($depositId);

        if (!$deposit) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        if (!$this->policy->update($user, $deposit)) {
            return response()->json([
                'message' => 'Bạn không có quyền chỉnh sửa khoản tiền cọc này.',
            ], 403);
        }

        $updated = $this->depositService->updateDeposit($deposit, $request->validated(), $user);

        return response()->json([
            'message' => __('spec_messages.deposit_updated_success'),
            'data' => new ContractDepositResource($updated),
        ]);
    }

    /**
     * POST /api/deposit-movements/{transaction}/void
     * Hủy một giao dịch hoàn trả hoặc khấu trừ cọc bị nhập nhầm (Mục 5 - Admin only)
     */
    public function voidMovement(VoidDepositMovementRequest $request, int $transactionId): JsonResponse
    {
        $user = $request->user();
        if (!$this->policy->voidMovement($user)) {
            return response()->json([
                'message' => 'Chỉ Quản trị viên mới có quyền hủy giao dịch tiền cọc.',
            ], 403);
        }

        $transaction = Transaction::find($transactionId);
        if (!$transaction) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        $validated = $request->validated();
        $updatedDeposit = $this->depositService->voidMovement($transaction, $validated['reason'], $user);

        return response()->json([
            'message' => __('spec_messages.deposit_movement_voided_success'),
            'data' => new ContractDepositResource($updatedDeposit),
        ]);
    }

    /**
     * GET /api/my-deposits
     * Khách hàng xem danh sách tiền cọc của các hợp đồng của mình (Mục 3.9 & 5)
     */
    public function myDeposits(Request $request): JsonResponse
    {
        $user = $request->user();
        $paginator = $this->depositQuery->getPaginatedList([
            'per_page' => 20,
            'contract_id' => $request->query('contract_id'),
        ], $user);

        return response()->json([
            'data' => ContractDepositResource::collection($paginator->getCollection()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /api/contracts/{contract}/deposit
     * Lấy thông tin tiền cọc của một hợp đồng cụ thể (dùng cho trang Chi tiết hợp đồng Admin & Khách hàng)
     */
    public function showByContract(Request $request, int $contractId): JsonResponse
    {
        $user = $request->user();
        $contract = Contract::find($contractId);

        if (!$contract) {
            return response()->json([
                'message' => __('spec_messages.row_1_not_found'),
            ], 404);
        }

        // Nếu hợp đồng có deposit_amount > 0 mà chưa có bản ghi contract_deposits thì tự động đồng bộ
        $deposit = ContractDeposit::where('contract_id', $contract->id)->first();
        if (!$deposit && (float) $contract->deposit_amount > 0) {
            $deposit = $this->depositService->ensureDepositForContract($contract, $user->id);
        }

        if (!$deposit) {
            return response()->json([
                'data' => null,
            ]);
        }

        $deposit->setRelation('contract', $contract);
        if (!$this->policy->view($user, $deposit)) {
            return response()->json([
                'message' => 'Bạn không có quyền xem thông tin tiền cọc của hợp đồng này.',
            ], 403);
        }

        $fullDeposit = $this->depositQuery->findWithMetrics($deposit->id);

        return response()->json([
            'data' => new ContractDepositResource($fullDeposit),
        ]);
    }
}

