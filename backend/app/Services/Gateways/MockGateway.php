<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Http\Request;
use RuntimeException;

class MockGateway implements PaymentGatewayInterface
{
    protected string $secret;

    public function __construct()
    {
        // Tuyệt đối không cho phép chạy MockGateway ở môi trường Production (Mục 3.6)
        if (app()->environment('production')) {
            throw new RuntimeException('Cổng giả lập (MockGateway) bị nghiêm cấm trên môi trường Production.');
        }

        $this->secret = config('payment.gateways.mock.secret', 'mock-secret-key-3tvland');
    }

    public function getName(): string
    {
        return 'mock';
    }

    public function createOrder(Transaction $transaction): array
    {
        $gatewayOrderId = 'MOCK-' . $transaction->transaction_code . '-' . time();
        $ttlMinutes = (int) config('payment.qr_ttl_minutes', 15);
        $expiresAt = now()->addMinutes($ttlMinutes);
        
        $frontendUrl = rtrim(config('payment.app_public_url', 'http://localhost:3000'), '/');
        $payUrl = "{$frontendUrl}/mock-gateway/pay/{$transaction->transaction_code}";

        return [
            'gateway_order_id' => $gatewayOrderId,
            'qr_content' => $payUrl,
            'pay_url' => $payUrl,
            'expires_at' => $expiresAt,
            'extra' => [
                'bank_account' => '9999888899',
                'bank_name' => 'Mock Sandbox Bank',
                'account_name' => 'CONG TY BDT 3TV LAND',
            ],
        ];
    }

    public function verifyCallback(Request $request): array
    {
        $payload = $request->all();
        $signature = $request->header('X-Mock-Signature') ?? $request->input('signature');

        $orderId = $payload['gateway_order_id'] ?? null;
        $txnId = $payload['gateway_txn_id'] ?? ('MOCK-TXN-' . time());
        $amount = (float) ($payload['amount'] ?? 0);
        $statusStr = strtolower($payload['action'] ?? $payload['status'] ?? 'success');

        // Tạo chuỗi ký mẫu: order_id|txn_id|amount|status
        $expectedRaw = "{$orderId}|{$txnId}|{$amount}|{$statusStr}";
        $expectedSignature = hash_hmac('sha256', $expectedRaw, $this->secret);

        // So sánh chữ ký an toàn chống tấn công timing
        $isValid = !empty($signature) && hash_equals($expectedSignature, (string) $signature);

        $status = match ($statusStr) {
            'success' => TransactionStatus::SUCCESS,
            'failed' => TransactionStatus::FAILED,
            'cancelled' => TransactionStatus::CANCELLED,
            default => TransactionStatus::FAILED,
        };

        return [
            'is_valid' => $isValid,
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => $txnId,
            'amount' => $amount,
            'status' => $status,
            'raw_payload' => $payload,
            'error' => $isValid ? null : 'Chữ ký Mock IPN không hợp lệ.',
        ];
    }

    public function queryStatus(Transaction $transaction): array
    {
        return [
            'is_success' => (int) $transaction->status === TransactionStatus::SUCCESS,
            'status' => (int) $transaction->status,
            'gateway_txn_id' => $transaction->gateway_txn_id,
            'amount' => (float) $transaction->amount,
            'raw' => ['query_time' => now()->toISOString()],
        ];
    }

    public function cancelOrder(Transaction $transaction): bool
    {
        return true;
    }

    /**
     * Helper tạo chữ ký hợp lệ cho việc test hoặc gọi callback giả lập
     */
    public function generateSignature(string $orderId, string $txnId, float $amount, string $action): string
    {
        $raw = "{$orderId}|{$txnId}|{$amount}|" . strtolower($action);
        return hash_hmac('sha256', $raw, $this->secret);
    }
}
