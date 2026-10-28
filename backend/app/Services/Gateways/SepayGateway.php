<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SepayGateway implements PaymentGatewayInterface
{
    protected string $apiKey;
    protected string $accountNumber;
    protected string $qrAccount;
    protected string $bankName;
    protected string $accountName;
    protected string $webhookToken;

    public function __construct()
    {
        $this->apiKey = (string) config('payment.gateways.sepay.api_key', '');
        $this->accountNumber = (string) config('payment.gateways.sepay.account_number', '1110222501');
        // BIDV qua SePay: tiền phải chuyển vào tài khoản ảo (VA) thì SePay mới nhận biến động
        $va = (string) config('payment.gateways.sepay.va_account', '');
        $this->qrAccount = $va !== '' ? $va : $this->accountNumber;
        $this->bankName = (string) config('payment.gateways.sepay.bank_name', 'BIDV');
        $this->accountName = (string) config('payment.gateways.sepay.account_name', 'PHAM LE HOANG HAO');
        $this->webhookToken = (string) config('payment.gateways.sepay.webhook_token', '');
    }

    public function getName(): string
    {
        return 'sepay';
    }

    /**
     * Tạo đơn thanh toán VietQR SePay
     */
    public function createOrder(Transaction $transaction): array
    {
        $ttlMinutes = (int) config('payment.qr_ttl_minutes', 15);
        $expiresAt = now()->addMinutes($ttlMinutes);
        $amountInt = (int) round((float) $transaction->amount);
        $des = $transaction->transaction_code;

        // URL ảnh chuẩn VietQR của SePay
        $acc = urlencode($this->qrAccount);
        $bank = urlencode($this->bankName);
        $desEncoded = urlencode($des);
        $qrImageUrl = "https://qr.sepay.vn/img?acc={$acc}&bank={$bank}&amount={$amountInt}&des={$desEncoded}&template=compact";

        // Chuỗi thanh toán VietQR chuẩn Napas hoặc URL ảnh
        $qrContent = $qrImageUrl;
        $gatewayOrderId = 'SEPAY-' . $transaction->transaction_code;

        return [
            'gateway_order_id' => $gatewayOrderId,
            'qr_content' => $qrContent,
            'pay_url' => $qrImageUrl,
            'expires_at' => $expiresAt,
            'extra' => [
                'bank_account' => $this->qrAccount,
                'bank_name' => $this->bankName,
                'account_name' => $this->accountName,
                'transfer_content' => $des,
                'amount' => $amountInt,
                'qr_image_url' => $qrImageUrl,
            ],
        ];
    }

    /**
     * Xác thực Webhook IPN từ SePay
     */
    public function verifyCallback(Request $request): array
    {
        $payload = $request->all();
        $authHeader = $request->header('Authorization', '');

        // 1. Kiểm tra xác thực qua Token/API Key
        $isValid = true;
        if (!empty($this->webhookToken)) {
            $expected = 'Apikey ' . $this->webhookToken;
            $isValid = hash_equals($expected, $authHeader) || hash_equals($this->webhookToken, (string) $request->input('token', ''));
        } elseif (!empty($this->apiKey)) {
            $expected = 'Apikey ' . $this->apiKey;
            $isValid = hash_equals($expected, $authHeader);
        }

        // 2. Tìm mã giao dịch trong content hoặc trường code
        // SePay gửi payload dạng: { id, gateway, transactionDate, accountNumber, code, content, transferType, transferAmount, referenceCode }
        $content = (string) ($payload['content'] ?? '');
        $code = (string) ($payload['code'] ?? '');
        $transferType = strtolower((string) ($payload['transferType'] ?? 'in'));
        $amount = (float) ($payload['transferAmount'] ?? $payload['amount'] ?? 0);
        $sepayId = (string) ($payload['id'] ?? $payload['referenceCode'] ?? ('SEPAY-' . time()));

        // Trích xuất mã giao dịch dạng TXN-YYYYMMDD-XXXXXX
        $extractedCode = null;
        // Ngân hàng thường xóa dấu '-' hoặc thêm khoảng trắng => chấp nhận cả TXN20261028000011
        foreach ([$code, $content] as $source) {
            if ($source !== '' && preg_match('/TXN[\s\-_]*(\d{8})[\s\-_]*(\d{6})/i', $source, $m)) {
                $extractedCode = 'TXN-' . $m[1] . '-' . $m[2];
                break;
            }
        }

        $gatewayOrderId = $extractedCode ? ('SEPAY-' . $extractedCode) : ($payload['gateway_order_id'] ?? null);

        $status = ($transferType === 'in' && $amount > 0)
            ? TransactionStatus::SUCCESS
            : TransactionStatus::FAILED;

        return [
            'is_valid' => $isValid,
            'gateway_order_id' => $gatewayOrderId,
            'transaction_code' => $extractedCode,
            'gateway_txn_id' => $sepayId,
            'amount' => $amount,
            'status' => $status,
            'raw_payload' => $payload,
            'error' => $isValid ? null : 'Xác thực SePay Webhook Token không hợp lệ.',
        ];
    }

    /**
     * Truy vấn trạng thái giao dịch từ SePay API
     */
    public function queryStatus(Transaction $transaction): array
    {
        if (empty($this->apiKey)) {
            return [
                'is_success' => (int) $transaction->status === TransactionStatus::SUCCESS,
                'status' => (int) $transaction->status,
                'gateway_txn_id' => $transaction->gateway_txn_id,
                'amount' => (float) $transaction->amount,
                'raw' => ['note' => 'Chưa cấu hình SEPAY_API_KEY để gọi truy vấn tự động.'],
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Apikey ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(8)->get('https://my.sepay.vn/userapi/transactions/list', [
                'transaction_content' => $transaction->transaction_code,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $txList = $data['transactions'] ?? [];

                foreach ($txList as $tx) {
                    $transferType = strtolower($tx['transfer_type'] ?? 'in');
                    $amount = (float) ($tx['amount_in'] ?? $tx['transfer_amount'] ?? 0);
                    if ($transferType === 'in' && $amount > 0) {
                        return [
                            'is_success' => true,
                            'status' => TransactionStatus::SUCCESS,
                            'gateway_txn_id' => (string) ($tx['id'] ?? $tx['reference_number'] ?? ''),
                            'amount' => $amount,
                            'raw' => $tx,
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Lỗi truy vấn SePay API cho đơn {$transaction->transaction_code}: " . $e->getMessage());
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
