<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MomoGateway implements PaymentGatewayInterface
{
    protected string $partnerCode;
    protected string $accessKey;
    protected string $secretKey;
    protected string $endpoint;
    protected string $queryEndpoint;

    public function __construct()
    {
        $this->partnerCode = (string) config('payment.gateways.momo.partner_code', '');
        $this->accessKey = (string) config('payment.gateways.momo.access_key', '');
        $this->secretKey = (string) config('payment.gateways.momo.secret_key', '');
        $this->endpoint = (string) config('payment.gateways.momo.endpoint', 'https://test-payment.momo.vn/v2/gateway/api/create');
        $this->queryEndpoint = (string) config('payment.gateways.momo.query_endpoint', 'https://test-payment.momo.vn/v2/gateway/api/query');
    }

    public function getName(): string
    {
        return 'momo';
    }

    public function createOrder(Transaction $transaction): array
    {
        $ttlMinutes = (int) config('payment.qr_ttl_minutes', 15);
        $expiresAt = now()->addMinutes($ttlMinutes);
        $gatewayOrderId = 'MOMO-' . $transaction->transaction_code . '-' . time();
        $amount = (int) round((float) $transaction->amount);
        $requestId = 'REQ-' . $transaction->transaction_code . '-' . time();
        $orderInfo = "Thanh toan hoa don #{$transaction->invoice?->invoice_no}";

        $frontendUrl = rtrim(config('payment.app_public_url', 'http://localhost:3000'), '/');
        $redirectUrl = "{$frontendUrl}/payments/callback?gateway=momo&code={$transaction->transaction_code}";
        $ipnUrl = url('/api/payments/momo/ipn');
        $extraData = '';
        $requestType = 'captureWallet';

        // Chuỗi tạo chữ ký MoMo v2 chính thức
        $rawHash = "accessKey={$this->accessKey}&amount={$amount}&extraData={$extraData}&ipnUrl={$ipnUrl}&orderId={$gatewayOrderId}&orderInfo={$orderInfo}&partnerCode={$this->partnerCode}&redirectUrl={$redirectUrl}&requestId={$requestId}&requestType={$requestType}";
        $signature = hash_hmac('sha256', $rawHash, $this->secretKey);

        $payload = [
            'partnerCode' => $this->partnerCode,
            'partnerName' => '3TV Land',
            'storeId' => '3TVLandStore',
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $gatewayOrderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature,
        ];

        try {
            $response = Http::timeout(10)->post($this->endpoint, $payload);
            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['resultCode']) && (int) $data['resultCode'] === 0) {
                    return [
                        'gateway_order_id' => $gatewayOrderId,
                        'qr_content' => $data['qrCodeUrl'] ?? $data['payUrl'] ?? null,
                        'pay_url' => $data['payUrl'] ?? null,
                        'expires_at' => $expiresAt,
                        'extra' => $data,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::error("Lỗi kết nối MoMo createOrder: " . $e->getMessage());
        }

        // Dự phòng URL chuyển hướng tới app MoMo
        $fallbackUrl = "https://test-payment.momo.vn/pay/{$gatewayOrderId}";
        return [
            'gateway_order_id' => $gatewayOrderId,
            'qr_content' => $fallbackUrl,
            'pay_url' => $fallbackUrl,
            'expires_at' => $expiresAt,
            'extra' => [],
        ];
    }

    public function verifyCallback(Request $request): array
    {
        $payload = $request->all();
        $signature = $payload['signature'] ?? '';

        $accessKey = $payload['accessKey'] ?? $this->accessKey;
        $amount = $payload['amount'] ?? 0;
        $extraData = $payload['extraData'] ?? '';
        $message = $payload['message'] ?? '';
        $orderId = $payload['orderId'] ?? '';
        $orderInfo = $payload['orderInfo'] ?? '';
        $orderType = $payload['orderType'] ?? '';
        $partnerCode = $payload['partnerCode'] ?? '';
        $payType = $payload['payType'] ?? '';
        $requestId = $payload['requestId'] ?? '';
        $responseTime = $payload['responseTime'] ?? '';
        $resultCode = $payload['resultCode'] ?? '';
        $transId = (string) ($payload['transId'] ?? '');

        // Chuỗi ký MoMo IPN Callback chuẩn
        $rawHash = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}&message={$message}&orderId={$orderId}&orderInfo={$orderInfo}&orderType={$orderType}&partnerCode={$partnerCode}&payType={$payType}&requestId={$requestId}&responseTime={$responseTime}&resultCode={$resultCode}&transId={$transId}";
        $expectedSignature = hash_hmac('sha256', $rawHash, $this->secretKey);

        $isValid = !empty($signature) && hash_equals($expectedSignature, (string) $signature);
        $status = ((int) $resultCode === 0) ? TransactionStatus::SUCCESS : TransactionStatus::FAILED;

        return [
            'is_valid' => $isValid,
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => $transId,
            'amount' => (float) $amount,
            'status' => $status,
            'raw_payload' => $payload,
            'error' => $isValid ? null : 'Chữ ký MoMo IPN không hợp lệ.',
        ];
    }

    public function queryStatus(Transaction $transaction): array
    {
        $requestId = 'QUERY-' . time();
        $orderId = $transaction->gateway_order_id ?? '';

        $rawHash = "accessKey={$this->accessKey}&orderId={$orderId}&partnerCode={$this->partnerCode}&requestId={$requestId}";
        $signature = hash_hmac('sha256', $rawHash, $this->secretKey);

        $payload = [
            'partnerCode' => $this->partnerCode,
            'requestId' => $requestId,
            'orderId' => $orderId,
            'signature' => $signature,
            'lang' => 'vi',
        ];

        try {
            $response = Http::timeout(8)->post($this->queryEndpoint, $payload);
            if ($response->successful()) {
                $data = $response->json();
                $resultCode = (int) ($data['resultCode'] ?? -1);
                return [
                    'is_success' => $resultCode === 0,
                    'status' => ($resultCode === 0) ? TransactionStatus::SUCCESS : TransactionStatus::FAILED,
                    'gateway_txn_id' => (string) ($data['transId'] ?? ''),
                    'amount' => (float) ($data['amount'] ?? $transaction->amount),
                    'raw' => $data,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("Lỗi truy vấn trạng thái MoMo: " . $e->getMessage());
        }

        return [
            'is_success' => (int) $transaction->status === TransactionStatus::SUCCESS,
            'status' => (int) $transaction->status,
            'gateway_txn_id' => $transaction->gateway_txn_id,
            'amount' => (float) $transaction->amount,
            'raw' => [],
        ];
    }

    public function cancelOrder(Transaction $transaction): bool
    {
        return true;
    }
}
