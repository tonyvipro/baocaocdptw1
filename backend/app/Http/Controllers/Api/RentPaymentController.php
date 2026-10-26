<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RentPaymentIndexRequest;
use App\Http\Requests\RecordPaymentRequest;
use App\Http\Resources\RentPaymentResource;
use App\Http\Resources\RentSummaryResource;
use App\Http\Resources\TransactionResource;
use App\Queries\RentPaymentQuery;
use App\Services\PaymentService;
use App\Services\InvoiceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RentPaymentController extends Controller
{
    protected RentPaymentQuery $rentPaymentQuery;
    protected PaymentService $paymentService;
    protected InvoiceService $invoiceService;

    public function __construct(
        RentPaymentQuery $rentPaymentQuery,
        PaymentService $paymentService,
        InvoiceService $invoiceService
    ) {
        $this->rentPaymentQuery = $rentPaymentQuery;
        $this->paymentService = $paymentService;
        $this->invoiceService = $invoiceService;
    }

    /**
     * Danh sách hóa đơn tiền thuê (GET /api/rent-payments)
     * Quy tắc: Không truy vấn DB trực tiếp trong controller, ủy quyền cho Query object.
     */
    public function index(RentPaymentIndexRequest $request): JsonResponse
    {
        $user = $request->user();
        if ($user && (int) $user->role_id === 5) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập màn hình này.',
            ], 403);
        }

        $paginator = $this->rentPaymentQuery->getPaginatedList($request->validated(), $user);

        return response()->json([
            'data' => RentPaymentResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ]);
    }

    /**
     * Thẻ thống kê thu tiền thuê theo tháng (GET /api/rent-payments/summary)
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && (int) $user->role_id === 5) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập chức năng này.',
            ], 403);
        }

        $month = $request->query('month');
        if (!$month || (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month) && $month !== 'all')) {
            $month = Carbon::now('Asia/Ho_Chi_Minh')->format('Y-m');
        }

        $summaryData = $this->rentPaymentQuery->getSummary($month, $user);

        return response()->json([
            'data' => new RentSummaryResource($summaryData),
        ]);
    }

    /**
     * Danh sách hóa đơn còn nợ phục vụ chọn trong modal ghi nhận (GET /api/rent-payments/payable)
     */
    public function payable(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && (int) $user->role_id === 5) {
            return response()->json([
                'message' => 'Bạn không có quyền thực hiện thao tác này.',
            ], 403);
        }

        $search = $request->query('search');
        $invoices = $this->rentPaymentQuery->getPayableInvoices($search, $user, 20);

        return response()->json([
            'data' => RentPaymentResource::collection($invoices),
        ]);
    }

    /**
     * Chi tiết hóa đơn tiền thuê kèm danh sách giao dịch (GET /api/rent-payments/{id})
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('view', $invoice);

        if ($request->user() && (int) $request->user()->role_id === 5) {
            return response()->json([
                'message' => 'Bạn không có quyền xem thông tin này.',
            ], 403);
        }

        return response()->json([
            'data' => new RentPaymentResource($invoice),
        ]);
    }

    /**
     * Ghi nhận thanh toán cho hóa đơn tiền thuê (POST /api/invoices/{id}/payments)
     * Điểm vào chung tái sử dụng cho cả thanh toán nhập tay và thanh toán cổng (QR).
     */
    public function recordPayment(RecordPaymentRequest $request, int $id): JsonResponse
    {
        $invoice = $this->invoiceService->getInvoiceDetail($id);
        Gate::authorize('update', $invoice);

        $result = $this->paymentService->recordPayment(
            $invoice,
            $request->validated(),
            'manual',
            $request->user()
        );

        return response()->json([
            'message' => 'Ghi nhận thanh toán thành công!',
            'data' => [
                'transaction' => new TransactionResource($result['transaction']),
                'invoice' => new RentPaymentResource($result['invoice']),
            ],
        ], 201);
    }
}
