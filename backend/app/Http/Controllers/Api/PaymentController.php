<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateQrPaymentRequest;
use App\Http\Requests\RecordPaymentRequest;
use App\Http\Resources\DebtResource;
use App\Http\Resources\TransactionResource;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Models\User;
use App\Queries\DebtQuery;
use App\Services\Gateways\GatewayManager;
use App\Services\InvoiceService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;
    protected InvoiceService $invoiceService;
    protected DebtQuery $debtQuery;
    protected GatewayManager $gatewayManager;

    public function __construct(
        PaymentService $paymentService,
        InvoiceService $invoiceService,
        DebtQuery $debtQuery,
        GatewayManager $gatewayManager
    ) {
        $this->paymentService = $paymentService;
        $this->invoiceService = $invoiceService;
        $this->debtQuery = $debtQuery;
        $this->gatewayManager = $gatewayManager;
    }

    /**
     * Danh sách công nợ & tình hình thanh toán (GET /api/payments/debts) - Hình 45
     */
    public function debts(Request $request): JsonResponse
    {
        $user = $request->user();
        $debts = $this->debtQuery->getDebts($user, $request->all());

        return response()->json([
            'data' => DebtResource::collection($debts->items()),
            'meta' => [
                'current_page' => $debts->currentPage(),
                'last_page' => $debts->lastPage(),
                'per_page' => $debts->perPage(),
                'total' => $debts->total(),
            ],
        ]);
    }

    /**
     * Số liệu 4 thẻ thống kê theo tháng (GET /api/payments/debts/summary) - Hình 45
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $month = $request->query('month');
        $summary = $this->debtQuery->getSummary($user, $month);

        return response()->json([
            'data' => $summary,
        ]);
    }

    /**
     * Chi tiết công nợ hóa đơn (GET /api/payments/debts/{invoice})
     */
    public function showDebt(Invoice $invoice, Request $request): JsonResponse
    {
        $this->authorizeInvoiceAccess($request->user(), $invoice);
        $detail = $this->invoiceService->getInvoiceDetail($invoice->id);

        return response()->json([
            'data' => new DebtResource($detail),
        ]);
    }

    /**
     * Lịch sử giao dịch của hóa đơn (GET /api/invoices/{invoice}/payments)
     */
    public function invoiceTransactions(Invoice $invoice, Request $request): JsonResponse
    {
        $this->authorizeInvoiceAccess($request->user(), $invoice);
        $transactions = $invoice->transactions()
            ->with('recorder')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => TransactionResource::collection($transactions),
        ]);
    }

    /**
     * Ghi nhận thanh toán thủ công (POST /api/invoices/{invoice}/payments)
     */
    public function recordPayment(Invoice $invoice, RecordPaymentRequest $request): JsonResponse
    {
        $user = $request->user();
        if ((int) $user->role_id === 3) { // Khách hàng không được ghi nhận tay
            abort(403, 'Khách hàng không có quyền ghi nhận thanh toán thủ công.');
        }

        $result = $this->paymentService->recordPayment(
            $invoice,
            $request->validated(),
            'manual',
            $user
        );

        return response()->json([
            'message' => __('spec_messages.manual_recorded_success') ?: 'Ghi nhận thanh toán thành công!',
            'data' => [
                'transaction' => new TransactionResource($result['transaction']),
                'invoice' => new DebtResource($result['invoice']),
                'is_duplicate' => $result['is_duplicate'] ?? false,
            ],
        ], 201);
    }

    /**
     * Khởi tạo giao dịch thanh toán QR (POST /api/invoices/{invoice}/payments/qr)
     */
    public function createQrPayment(Invoice $invoice, CreateQrPaymentRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeInvoiceAccess($user, $invoice);

        $result = $this->paymentService->createQrPayment(
            $invoice,
            $request->validated(),
            $user
        );

        $ttlMinutes = (int) config('payment.qr_ttl_minutes', 15);
        $msg = str_replace(':minutes', (string) $ttlMinutes, __('spec_messages.qr_created') ?: "Đã tạo mã thanh toán. Vui lòng quét mã trong {$ttlMinutes} phút.");

        return response()->json([
            'message' => $msg,
            'data' => [
                'transaction' => new TransactionResource($result['transaction']),
                'transaction_code' => $result['transaction_code'],
                'gateway_order_id' => $result['gateway_order_id'],
                'qr_content' => $result['qr_content'],
                'pay_url' => $result['pay_url'],
                'amount' => $result['amount'],
                'gateway' => $result['gateway'],
                'expires_at' => $result['expires_at'],
                'is_duplicate' => $result['is_duplicate'] ?? false,
            ],
        ], 201);
    }

    /**
     * Hỏi trạng thái giao dịch kèm tự động đồng bộ (GET /api/payment-transactions/{transaction_code})
     */
    public function showTransaction(string $transactionCode, Request $request): JsonResponse
    {
        $transaction = Transaction::where('transaction_code', $transactionCode)->first();
        if (!$transaction) {
            abort(404, 'Không tìm thấy giao dịch thanh toán.');
        }

        $this->authorizeInvoiceAccess($request->user(), $transaction->invoice);

        // Chủ động truy vấn cổng và đồng bộ trạng thái
        $syncedTx = $this->paymentService->checkAndSyncStatus($transaction);

        return response()->json([
            'data' => new TransactionResource($syncedTx),
            'invoice_status' => $syncedTx->invoice?->status,
            'invoice_paid_amount' => (float) $syncedTx->invoice?->paid_amount,
        ]);
    }

    /**
     * Hủy giao dịch QR đang chờ (POST /api/payment-transactions/{transaction_code}/cancel)
     */
    public function cancelQrPayment(string $transactionCode, Request $request): JsonResponse
    {
        $transaction = Transaction::where('transaction_code', $transactionCode)->first();
        if (!$transaction) {
            abort(404, 'Không tìm thấy giao dịch thanh toán.');
        }

        $this->authorizeInvoiceAccess($request->user(), $transaction->invoice);

        $cancelled = $this->paymentService->cancelQrPayment($transaction, $request->user());

        return response()->json([
            'message' => __('spec_messages.cancelled_success') ?: 'Đã hủy giao dịch thanh toán.',
            'data' => new TransactionResource($cancelled),
        ]);
    }

    /**
     * Hủy giao dịch ghi nhận nhập tay (POST /api/payment-transactions/{id}/cancel-manual) - Chỉ Admin
     */
    public function cancelManualPayment(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        if ((int) $user->role_id !== 1) {
            abort(403, 'Chỉ Quản trị viên (Admin) mới có quyền hủy giao dịch nhập tay.');
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ], [
            'reason.required' => 'Vui lòng nhập lý do hủy giao dịch.',
            'reason.max' => 'Lý do hủy không được vượt quá 500 ký tự.',
        ]);

        $transaction = Transaction::find($id);
        if (!$transaction) {
            abort(404, 'Giao dịch không tồn tại.');
        }

        $cancelled = $this->paymentService->cancelManualPayment($transaction, $request->input('reason'), $user);

        return response()->json([
            'message' => __('spec_messages.manual_cancelled_success') ?: 'Đã hủy ghi nhận thanh toán thủ công.',
            'data' => new TransactionResource($cancelled),
        ]);
    }

    /**
     * Xử lý Callback / IPN từ cổng thanh toán (POST /api/payments/{gateway}/ipn) - Công khai
     */
    public function handleIpn(string $gateway, Request $request): JsonResponse
    {
        $gatewayInstance = $this->gatewayManager->gateway($gateway);
        $verifiedData = $gatewayInstance->verifyCallback($request);

        $result = $this->paymentService->applyGatewayResult($gateway, $verifiedData, $request->ip());

        // Phản hồi định dạng chuẩn theo từng cổng yêu cầu để cổng ngừng gửi lại
        if ($gateway === 'momo') {
            return response()->json([
                'resultCode' => 0,
                'message' => 'Received',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Webhook received and processed.',
            'result' => $result,
        ]);
    }

    /**
     * Trang chuyển hướng trở lại sau thanh toán cổng (GET /api/payments/{gateway}/return)
     */
    public function handleReturn(string $gateway, Request $request)
    {
        $frontendUrl = rtrim(config('payment.app_public_url', 'http://localhost:3000'), '/');
        $code = $request->query('code', $request->query('orderId', ''));

        // Chỉ điều hướng trình duyệt, không bao giờ tin cậy kết quả return từ trình duyệt (Mục 3.4.3)
        return redirect()->to("{$frontendUrl}/payments/result?gateway={$gateway}&code={$code}");
    }

    /**
     * Giả lập giao dịch MockGateway (GET /api/mock-gateway/pay/{transaction_code})
     */
    public function mockPaymentInfo(string $transactionCode): JsonResponse
    {
        if (app()->environment('production')) {
            abort(404);
        }

        $transaction = Transaction::where('transaction_code', $transactionCode)->first();
        if (!$transaction) {
            abort(404, 'Không tìm thấy giao dịch.');
        }

        return response()->json([
            'data' => [
                'transaction_code' => $transaction->transaction_code,
                'gateway_order_id' => $transaction->gateway_order_id,
                'amount' => (float) $transaction->amount,
                'status' => (int) $transaction->status,
                'status_label' => $transaction->status_label,
                'invoice_no' => $transaction->invoice?->invoice_no,
                'property_title' => $transaction->invoice?->contract?->property?->title,
                'expires_at' => $transaction->expires_at?->format('Y-m-d H:i:s'),
                'is_expired' => $transaction->expires_at ? Carbon::parse($transaction->expires_at)->isPast() : false,
            ],
        ]);
    }

    /**
     * Thực thi hành động giả lập (POST /api/mock-gateway/pay/{transaction_code}/{action})
     */
    public function mockPaymentAction(string $transactionCode, string $action): JsonResponse
    {
        if (app()->environment('production')) {
            abort(404);
        }

        $action = strtolower($action);
        if (!in_array($action, ['success', 'failed', 'cancel'], true)) {
            abort(400, 'Hành động không hợp lệ. Chỉ chấp nhận success, failed, cancel.');
        }

        $transaction = Transaction::where('transaction_code', $transactionCode)->first();
        if (!$transaction) {
            abort(404, 'Không tìm thấy giao dịch.');
        }

        /** @var \App\Services\Gateways\MockGateway $mockGateway */
        $mockGateway = $this->gatewayManager->gateway('mock');
        $txnId = 'MOCK-TXN-' . time();
        $signature = $mockGateway->generateSignature(
            $transaction->gateway_order_id,
            $txnId,
            (float) $transaction->amount,
            $action
        );

        $fakeRequest = Request::create("/api/payments/mock/ipn", 'POST', [
            'gateway_order_id' => $transaction->gateway_order_id,
            'gateway_txn_id' => $txnId,
            'amount' => (float) $transaction->amount,
            'action' => $action,
            'signature' => $signature,
        ]);
        $fakeRequest->headers->set('X-Mock-Signature', $signature);

        $verified = $mockGateway->verifyCallback($fakeRequest);
        $result = $this->paymentService->applyGatewayResult('mock', $verified, '127.0.0.1');

        return response()->json([
            'message' => "Đã mô phỏng thanh toán hành động '{$action}' thành công.",
            'result' => $result,
            'transaction' => new TransactionResource($transaction->fresh()),
        ]);
    }

    /**
     * Kiểm tra quyền truy cập hóa đơn (Policy Isolation chống IDOR)
     */
    protected function authorizeInvoiceAccess(User $user, Invoice $invoice): void
    {
        if ((int) $user->role_id === 1) {
            return; // Admin có toàn quyền
        }

        if ((int) $user->role_id === 2) {
            // Môi giới chỉ xem hóa đơn của hợp đồng mình phụ trách
            if ($invoice->contract?->broker_id !== $user->id) {
                abort(403, 'Bạn không có quyền truy cập hóa đơn của hợp đồng này.');
            }
            return;
        }

        if ((int) $user->role_id === 3) {
            // Khách hàng chỉ xem hóa đơn của chính mình
            if ($invoice->contract?->customer_id !== $user->id) {
                abort(403, 'Bạn chỉ có quyền truy cập hóa đơn của chính mình.');
            }
            return;
        }
    }
}
