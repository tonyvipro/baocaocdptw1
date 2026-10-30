<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Transaction;
use App\Models\PaymentGatewayLog;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\TransactionStatus;
use App\Enums\TransactionSource;
use App\Exceptions\StaleVersionException;
use App\Exceptions\DuplicatePaymentSuspectedException;
use App\Services\Gateways\GatewayManager;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\HttpResponseException;

class PaymentService
{
    protected InvoiceService $invoiceService;
    protected GatewayManager $gatewayManager;
    protected PropertyAvailabilityService $availabilityService;

    public function __construct(
        InvoiceService $invoiceService,
        GatewayManager $gatewayManager,
        PropertyAvailabilityService $availabilityService
    ) {
        $this->invoiceService = $invoiceService;
        $this->gatewayManager = $gatewayManager;
        $this->availabilityService = $availabilityService;
    }

    /**
     * Ghi nhận thanh toán thủ công (Manual Payment)
     * Tái sử dụng cho Quản lý tiền thuê (Hình 43) và Thanh toán (Hình 45)
     *
     * @param Invoice $invoice Hóa đơn cần ghi nhận
     * @param array $data Dữ liệu thanh toán
     * @param string $source 'manual' hoặc 'gateway'
     * @param User|null $actor Người thực hiện ghi nhận
     * @return array ['transaction' => Transaction, 'invoice' => Invoice, 'is_duplicate' => bool]
     */
    public function recordPayment(Invoice $invoice, array $data, string $source = TransactionSource::MANUAL, ?User $actor = null): array
    {
        return DB::transaction(function () use ($invoice, $data, $source, $actor) {
            // 1. Khóa bi quan hàng hóa đơn theo thứ tự: users -> properties -> contracts -> invoices -> transactions
            $locked = Invoice::lockForUpdate()->find($invoice->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json([
                    'message' => __('spec_messages.row_3_invoice_not_found') ?: 'Hóa đơn không tồn tại.',
                ], 404));
            }

            // 2. Chống gửi trùng qua client_token (Idempotency - Mục 3.6 & 3.12)
            if (!empty($data['client_token'])) {
                $existingTx = Transaction::where('client_token', $data['client_token'])->first();
                if ($existingTx) {
                    return [
                        'transaction' => $existingTx,
                        'invoice' => $locked->fresh(['contract.property', 'contract.customer', 'updater']),
                        'is_duplicate' => true,
                    ];
                }
            }

            // 3. Khóa lạc quan (Optimistic Locking - Mục 3.12)
            if (isset($data['version']) && (int) $locked->version !== (int) $data['version']) {
                throw new StaleVersionException(
                    __('spec_messages.row_2_stale_version') ?: 'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.',
                    new \App\Http\Resources\InvoiceResource($locked->fresh(['contract.property', 'contract.customer', 'items', 'transactions', 'updater']))
                );
            }

            // 4. Kiểm tra loại hóa đơn hợp lệ
            if (!in_array($locked->type, InvoiceType::all(), true)) {
                throw ValidationException::withMessages([
                    'invoice_id' => ['Loại hóa đơn không hợp lệ.'],
                ]);
            }

            // 5. Kiểm tra trạng thái hóa đơn
            if ($locked->status === InvoiceStatus::CANCELLED) {
                throw new HttpResponseException(response()->json([
                    'message' => __('spec_messages.invoice_cancelled') ?: 'Không thể ghi nhận thanh toán cho hóa đơn đã hủy.',
                ], 409));
            }

            // Tính số tiền còn nợ BÊN TRONG khóa
            $totalAmount = (float) $locked->amount;
            $txPaid = (float) $locked->transactions()
                ->where('status', TransactionStatus::SUCCESS)
                ->sum('amount');
            $paidSoFar = max($txPaid, (float) ($locked->paid_amount ?? 0));
            $remaining = max(0.0, round($totalAmount - $paidSoFar, 2));

            if ($remaining <= 0) {
                throw new HttpResponseException(response()->json([
                    'message' => __('spec_messages.invoice_fully_paid') ?: 'Hóa đơn này đã được thanh toán đủ.',
                ], 409));
            }

            // 6. Kiểm tra số tiền thanh toán
            $amount = round((float) ($data['amount'] ?? 0), 2);
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => [__('spec_messages.row_20_amount_positive') ?: 'Số tiền thanh toán phải lớn hơn 0.'],
                ]);
            }

            if ($amount > $remaining) {
                $remFormatted = number_format($remaining, 0, ',', '.') . ' VNĐ';
                throw ValidationException::withMessages([
                    'amount' => ["Số tiền thanh toán vượt quá số tiền còn nợ ({$remFormatted})."],
                ]);
            }

            // 7. Kiểm tra ngày thanh toán (paid_at)
            $paidAt = isset($data['paid_at']) ? Carbon::parse($data['paid_at']) : Carbon::now('Asia/Ho_Chi_Minh');
            if ($paidAt->gt(Carbon::now('Asia/Ho_Chi_Minh')->addMinutes(5))) {
                throw ValidationException::withMessages([
                    'paid_at' => ['Ngày thanh toán không được ở tương lai.'],
                ]);
            }

            if ($locked->issue_date && $paidAt->lt(Carbon::parse($locked->issue_date)->startOfDay())) {
                throw ValidationException::withMessages([
                    'paid_at' => ['Ngày thanh toán không được trước ngày lập hóa đơn.'],
                ]);
            }

            // 8. Kiểm tra mã tham chiếu duy nhất cho hóa đơn
            $referenceCode = !empty($data['reference_code']) ? trim($data['reference_code']) : null;
            if ($referenceCode) {
                $refExists = Transaction::where('invoice_id', $locked->id)
                    ->where('reference_code', $referenceCode)
                    ->exists();
                if ($refExists) {
                    throw ValidationException::withMessages([
                        'reference_code' => ["Mã tham chiếu '{$referenceCode}' đã tồn tại cho hóa đơn này."],
                    ]);
                }
            }

            // 9. Nghi trùng giao dịch trong 5 phút
            if (!$referenceCode && empty($data['confirm_duplicate'])) {
                $fiveMinutesAgo = Carbon::now('Asia/Ho_Chi_Minh')->subMinutes(5);
                $suspected = Transaction::where('invoice_id', $locked->id)
                    ->where('amount', $amount)
                    ->where('payment_method', $data['payment_method'])
                    ->where('created_at', '>=', $fiveMinutesAgo)
                    ->exists();

                if ($suspected) {
                    throw new DuplicatePaymentSuspectedException(
                        'Có khoản thanh toán tương tự vừa được ghi nhận. Bạn có chắc muốn ghi nhận thêm?'
                    );
                }
            }

            // 10. Sinh mã giao dịch duy nhất tuần tự: TXN-{YYYYMMDD}-{6 chữ số}
            $dateStr = $paidAt->format('Ymd');
            $countToday = Transaction::whereDate('created_at', Carbon::today('Asia/Ho_Chi_Minh'))->count() + 1;
            $txCode = "TXN-{$dateStr}-" . str_pad($countToday, 6, '0', STR_PAD_LEFT);
            $dupCount = 1;
            while (Transaction::where('transaction_code', $txCode)->exists()) {
                $txCode = "TXN-{$dateStr}-" . str_pad($countToday + $dupCount, 6, '0', STR_PAD_LEFT);
                $dupCount++;
            }

            // 11. Tạo bản ghi giao dịch
            $transaction = Transaction::create([
                'invoice_id' => $locked->id,
                'transaction_code' => $txCode,
                'amount' => $amount,
                'source' => $source,
                'status' => TransactionStatus::SUCCESS,
                'payment_method' => $data['payment_method'],
                'reference_code' => $referenceCode,
                'note' => $data['note'] ?? null,
                'recorded_by' => $actor?->id,
                'client_token' => $data['client_token'] ?? null,
                'paid_at' => $paidAt,
            ]);

            // 12. Tăng version và cập nhật updated_by
            $locked->version = ($locked->version ?? 1) + 1;
            $locked->updated_by = $actor?->id;
            $locked->save();

            // 13. Đồng bộ lại trạng thái hóa đơn
            $this->invoiceService->syncPaymentStatus($locked);

            // 14. Kiểm tra điều kiện đồng bộ tính khả dụng BĐS (Phần B)
            if ($locked->contract) {
                $this->availabilityService->syncForContract($locked->contract);
            }

            // 15. Ghi activity log
            $this->invoiceService->logActivity(
                $actor?->id,
                'RECORD_PAYMENT',
                $locked->id,
                null,
                [
                    'transaction_code' => $txCode,
                    'amount' => $amount,
                    'payment_method' => $data['payment_method'],
                    'reference_code' => $referenceCode,
                    'source' => $source,
                ]
            );

            // 16. Tạo notification cho khách hàng
            $customer = $locked->contract?->customer;
            if ($customer) {
                try {
                    $amountStr = number_format($amount, 0, ',', '.') . ' VNĐ';
                    DB::table('notifications')->insert([
                        'id' => (string) Str::uuid(),
                        'notifiable_type' => User::class,
                        'notifiable_id' => $customer->id,
                        'type' => 'App\Notifications\RentPaymentRecordedNotification',
                        'data' => json_encode([
                            'title' => 'Thanh toán đã được ghi nhận',
                            'message' => "Đã ghi nhận thanh toán {$amountStr} cho hóa đơn {$locked->invoice_no}.",
                            'invoice_id' => $locked->id,
                            'transaction_code' => $txCode,
                            'amount' => $amount,
                        ], JSON_UNESCAPED_UNICODE),
                        'read_at' => null,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                } catch (\Throwable $e) {
                    // Silently ignore notification failure
                }
            }

            return [
                'transaction' => $transaction,
                'invoice' => $locked->fresh(['contract.property', 'contract.customer', 'updater']),
                'is_duplicate' => false,
            ];
        }, 3);
    }

    /**
     * Khởi tạo giao dịch thanh toán QR qua cổng (Mục 3.4)
     *
     * @param Invoice $invoice Hóa đơn cần thanh toán
     * @param array $data ['gateway' => 'sepay'|'mock'|'momo', 'amount' => float, 'client_token' => string]
     * @param User|null $actor Người tạo yêu cầu (khách hoặc nhân viên)
     * @return array
     */
    public function createQrPayment(Invoice $invoice, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($invoice, $data, $actor) {
            // 1. Khóa bi quan hàng hóa đơn
            $locked = Invoice::lockForUpdate()->find($invoice->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn không tồn tại.',
                ], 404));
            }

            // 2. Chống gửi trùng qua client_token
            if (!empty($data['client_token'])) {
                $existingTx = Transaction::where('client_token', $data['client_token'])->first();
                if ($existingTx) {
                    return [
                        'transaction' => $existingTx,
                        'qr_content' => $existingTx->qr_content,
                        'pay_url' => $existingTx->pay_url,
                        'expires_at' => $existingTx->expires_at,
                        'is_duplicate' => true,
                    ];
                }
            }

            // 3. Kiểm tra trạng thái hóa đơn
            if ($locked->status === InvoiceStatus::CANCELLED) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Không thể thanh toán cho hóa đơn đã hủy.',
                ], 409));
            }

            // 4. Dọn dẹp các giao dịch QR đang chờ cũ của hóa đơn này để không bị nghẽn (Mục 3.4.1)
            Transaction::where('invoice_id', $locked->id)
                ->where('status', TransactionStatus::PENDING)
                ->where('source', TransactionSource::GATEWAY)
                ->update([
                    'status' => TransactionStatus::CANCELLED,
                    'failure_reason' => 'Thay thế bởi mã QR thanh toán mới.',
                    'updated_at' => Carbon::now(),
                ]);

            // 5. Tính số tiền còn nợ
            $totalAmount = (float) $locked->amount;
            $txPaid = (float) $locked->transactions()
                ->where('status', TransactionStatus::SUCCESS)
                ->sum('amount');
            $paidSoFar = max($txPaid, (float) ($locked->paid_amount ?? 0));
            $remaining = max(0.0, round($totalAmount - $paidSoFar, 2));

            if ($remaining <= 0) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn này đã được thanh toán đủ.',
                ], 409));
            }

            $amount = round((float) ($data['amount'] ?? $remaining), 2);
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => ['Số tiền thanh toán phải lớn hơn 0.'],
                ]);
            }

            if ($amount > $remaining) {
                $remFormatted = number_format($remaining, 0, ',', '.') . ' VNĐ';
                throw ValidationException::withMessages([
                    'amount' => ["Số tiền thanh toán vượt quá số tiền còn nợ ({$remFormatted})."],
                ]);
            }

            // 6. Kiểm tra giới hạn cổng thanh toán (Mục 3.9)
            $gatewayName = strtolower($data['gateway'] ?? config('payment.default', 'sepay'));
            $gatewayConfig = config("payment.gateways.{$gatewayName}");
            if (!$gatewayConfig) {
                throw ValidationException::withMessages([
                    'gateway' => ["Cổng thanh toán '{$gatewayName}' không tồn tại trong cấu hình."],
                ]);
            }

            $minAmount = (float) ($gatewayConfig['min_amount'] ?? 1000);
            $maxAmount = (float) ($gatewayConfig['max_amount'] ?? 500000000);

            if ($amount < $minAmount || $amount > $maxAmount) {
                $minFmt = number_format($minAmount, 0, ',', '.') . ' VNĐ';
                $maxFmt = number_format($maxAmount, 0, ',', '.') . ' VNĐ';
                throw ValidationException::withMessages([
                    'amount' => ["Số tiền thanh toán qua {$gatewayName} phải từ {$minFmt} đến {$maxFmt}. Vui lòng chọn hình thức thanh toán khác."],
                ]);
            }

            // 7. Sinh mã giao dịch duy nhất
            $today = Carbon::today('Asia/Ho_Chi_Minh');
            $dateStr = $today->format('Ymd');
            $countToday = Transaction::whereDate('created_at', $today)->count() + 1;
            $txCode = "TXN-{$dateStr}-" . str_pad($countToday, 6, '0', STR_PAD_LEFT);
            $dupCount = 1;
            while (Transaction::where('transaction_code', $txCode)->exists()) {
                $txCode = "TXN-{$dateStr}-" . str_pad($countToday + $dupCount, 6, '0', STR_PAD_LEFT);
                $dupCount++;
            }

            $ttlMinutes = (int) config('payment.qr_ttl_minutes', 15);
            $expiresAt = Carbon::now()->addMinutes($ttlMinutes);

            // 8. Tạo bản ghi giao dịch ở trạng thái CHỜ XỬ LÝ (PENDING = 0)
            $transaction = Transaction::create([
                'invoice_id' => $locked->id,
                'transaction_code' => $txCode,
                'amount' => $amount,
                'source' => TransactionSource::GATEWAY,
                'status' => TransactionStatus::PENDING,
                'payment_method' => $gatewayName,
                'gateway' => $gatewayName,
                'gateway_order_id' => 'ORD-' . $locked->invoice_no . '-' . time() . '-' . Str::random(4),
                'recorded_by' => $actor?->id,
                'client_token' => $data['client_token'] ?? null,
                'expires_at' => $expiresAt,
            ]);

            // 9. Gọi cổng thanh toán để sinh đơn và mã QR
            $gatewayInstance = $this->gatewayManager->gateway($gatewayName);
            $orderResult = $gatewayInstance->createOrder($transaction);

            // Cập nhật thông tin trả về từ cổng vào bản ghi transaction
            $transaction->update([
                'gateway_order_id' => $orderResult['gateway_order_id'] ?? $transaction->gateway_order_id,
                'qr_content' => $orderResult['qr_content'] ?? null,
                'pay_url' => $orderResult['pay_url'] ?? null,
                'expires_at' => $orderResult['expires_at'] ?? $expiresAt,
            ]);

            // 10. Ghi log khởi tạo đơn cổng
            PaymentGatewayLog::create([
                'transaction_id' => $transaction->id,
                'gateway' => $gatewayName,
                'event' => 'order_created',
                'payload' => [
                    'amount' => $amount,
                    'invoice_id' => $locked->id,
                    'invoice_no' => $locked->invoice_no,
                    'order_result' => $orderResult,
                ],
                'signature_valid' => true,
                'ip' => request()->ip(),
            ]);

            return [
                'transaction' => $transaction->fresh(),
                'transaction_code' => $transaction->transaction_code,
                'gateway_order_id' => $transaction->gateway_order_id,
                'qr_content' => $transaction->qr_content,
                'pay_url' => $transaction->pay_url,
                'amount' => (float) $transaction->amount,
                'gateway' => $gatewayName,
                'expires_at' => $transaction->expires_at?->toISOString(),
                'is_duplicate' => false,
            ];
        }, 3);
    }

    /**
     * Điểm DUY NHẤT xử lý kết quả thanh toán từ cổng (Mục 3.4 & 3.5)
     * Được gọi bởi cả Callback/IPN và truy vấn trạng thái chủ động
     *
     * @param string $gatewayName Tên cổng ('sepay', 'mock', 'momo', etc.)
     * @param array $callbackData Dữ liệu đã xác thực từ verifyCallback()
     * @param string|null $ip IP nguồn gửi request
     * @return array
     */
    public function applyGatewayResult(string $gatewayName, array $callbackData, ?string $ip = null): array
    {
        // 1. Ghi log append-only vào bảng payment_gateway_logs (Mục 3.5)
        $logRecord = PaymentGatewayLog::create([
            'transaction_id' => null,
            'gateway' => $gatewayName,
            'event' => 'callback_received',
            'payload' => $callbackData['raw_payload'] ?? [],
            'signature_valid' => (bool) ($callbackData['is_valid'] ?? false),
            'ip' => $ip ?? request()->ip(),
        ]);

        // 2. Kiểm tra tính hợp lệ của chữ ký / token
        if (empty($callbackData['is_valid'])) {
            Log::warning("Chữ ký IPN không hợp lệ từ cổng {$gatewayName}", [
                'ip' => $ip,
                'error' => $callbackData['error'] ?? 'Invalid signature',
            ]);
            throw new HttpResponseException(response()->json([
                'status' => 'error',
                'message' => 'Chữ ký không hợp lệ.',
            ], 400));
        }

        // 3. Tìm giao dịch trong DB theo gateway_order_id hoặc transaction_code
        $gatewayOrderId = $callbackData['gateway_order_id'] ?? null;
        $transactionCode = $callbackData['transaction_code'] ?? null;

        $transaction = null;
        if ($gatewayOrderId) {
            $transaction = Transaction::where('gateway_order_id', $gatewayOrderId)->first();
        }
        if (!$transaction && $transactionCode) {
            $transaction = Transaction::where('transaction_code', $transactionCode)->first();
        }

        if (!$transaction) {
            Log::warning("IPN không tìm thấy giao dịch cho orderId: {$gatewayOrderId}, code: {$transactionCode}");
            return [
                'status' => 'not_found',
                'message' => 'Không tìm thấy giao dịch tương ứng.',
            ];
        }

        // Cập nhật transaction_id vào log vừa tạo
        $logRecord->update(['transaction_id' => $transaction->id]);

        return DB::transaction(function () use ($transaction, $callbackData, $gatewayName) {
            // Khóa bi quan dòng transaction và hóa đơn
            $lockedTx = Transaction::lockForUpdate()->find($transaction->id);
            $lockedInvoice = Invoice::lockForUpdate()->find($lockedTx->invoice_id);

            $gatewayTxnId = (string) ($callbackData['gateway_txn_id'] ?? '');
            $reportedAmount = (float) ($callbackData['amount'] ?? 0);
            $targetStatus = (int) ($callbackData['status'] ?? TransactionStatus::FAILED);

            // 4. IDEMPOTENT: Nếu giao dịch đã THÀNH CÔNG, bỏ qua không xử lý lại (Mục 3.5)
            if ((int) $lockedTx->status === TransactionStatus::SUCCESS) {
                return [
                    'status' => 'already_processed',
                    'message' => 'Giao dịch đã được xử lý trước đó.',
                    'transaction_code' => $lockedTx->transaction_code,
                ];
            }

            // 5. Kiểm tra số tiền cổng báo KHỚP đúng số tiền giao dịch trong DB (Mục 3.5)
            if ($targetStatus === TransactionStatus::SUCCESS) {
                if (abs($reportedAmount - (float) $lockedTx->amount) > 0.01) {
                    // Sai lệch số tiền: Đánh dấu CẦN ĐỐI SOÁT (status = 6), không ghi nhận thu
                    $lockedTx->update([
                        'status' => TransactionStatus::RECONCILE,
                        'gateway_txn_id' => $gatewayTxnId,
                        'failure_reason' => "Sai lệch số tiền: Giao dịch DB là {$lockedTx->amount}, Cổng báo {$reportedAmount}.",
                    ]);

                    $this->notifyAdminReconciliationNeeded($lockedTx, $lockedInvoice, 'Số tiền thanh toán cổng báo không khớp hóa đơn.');

                    return [
                        'status' => 'reconciliation_required',
                        'message' => 'Số tiền không khớp, giao dịch chuyển sang Cần đối soát.',
                    ];
                }

                // 6. Xử lý thanh toán thành công muộn (Giao dịch đã Hết hạn hoặc Đã hủy) (Mục 3.5)
                $isLatePayment = in_array((int) $lockedTx->status, [TransactionStatus::EXPIRED, TransactionStatus::CANCELLED], true);
                if ($isLatePayment) {
                    $totalAmount = (float) $lockedInvoice->amount;
                    $paidSoFar = (float) $lockedInvoice->transactions()
                        ->where('status', TransactionStatus::SUCCESS)
                        ->where('id', '!=', $lockedTx->id)
                        ->sum('amount');
                    $currentRemaining = max(0.0, round($totalAmount - $paidSoFar, 2));

                    // Nếu hóa đơn đã được thanh toán hoặc số tiền này sẽ làm thu vượt -> Chuyển sang CẦN ĐỐI SOÁT (6)
                    if ($currentRemaining < (float) $lockedTx->amount) {
                        $lockedTx->update([
                            'status' => TransactionStatus::RECONCILE,
                            'gateway_txn_id' => $gatewayTxnId,
                            'failure_reason' => "Thanh toán muộn gây thu vượt số nợ hiện tại ({$currentRemaining}).",
                        ]);

                        $this->notifyAdminReconciliationNeeded($lockedTx, $lockedInvoice, 'Thanh toán thành công muộn gây thu vượt số nợ hóa đơn.');

                        return [
                            'status' => 'reconciliation_required',
                            'message' => 'Thanh toán muộn gây thu vượt, đã chuyển đối soát.',
                        ];
                    }
                }

                // 7. Ghi nhận giao dịch THÀNH CÔNG (status = 1)
                $lockedTx->status = TransactionStatus::SUCCESS;
                $lockedTx->gateway_txn_id = $gatewayTxnId;
                $lockedTx->paid_at = Carbon::now('Asia/Ho_Chi_Minh');
                $lockedTx->save();

                // 8. Tăng version hóa đơn và đồng bộ trạng thái hóa đơn
                $lockedInvoice->version = ($lockedInvoice->version ?? 1) + 1;
                $lockedInvoice->save();

                $this->invoiceService->syncPaymentStatus($lockedInvoice);

                // 9. Kiểm tra và đồng bộ vòng đời hiển thị BĐS (Phần B)
                if ($lockedInvoice->contract) {
                    $this->availabilityService->syncForContract($lockedInvoice->contract);
                }

                // 10. Ghi log hoạt động
                $this->invoiceService->logActivity(
                    null,
                    'GATEWAY_PAYMENT_SUCCESS',
                    $lockedInvoice->id,
                    null,
                    [
                        'gateway' => $gatewayName,
                        'transaction_code' => $lockedTx->transaction_code,
                        'amount' => $lockedTx->amount,
                        'gateway_txn_id' => $gatewayTxnId,
                    ]
                );

                // 11. Gửi thông báo cho khách hàng
                $customer = $lockedInvoice->contract?->customer;
                if ($customer) {
                    try {
                        $amtStr = number_format($lockedTx->amount, 0, ',', '.') . ' VNĐ';
                        DB::table('notifications')->insert([
                            'id' => (string) Str::uuid(),
                            'notifiable_type' => User::class,
                            'notifiable_id' => $customer->id,
                            'type' => 'App\Notifications\PaymentSuccessNotification',
                            'data' => json_encode([
                                'title' => 'Thanh toán QR thành công',
                                'message' => "Bạn đã thanh toán thành công {$amtStr} cho hóa đơn {$lockedInvoice->invoice_no}.",
                                'invoice_id' => $lockedInvoice->id,
                                'transaction_code' => $lockedTx->transaction_code,
                            ], JSON_UNESCAPED_UNICODE),
                            'read_at' => null,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now(),
                        ]);
                    } catch (\Throwable $e) {}
                }

                return [
                    'status' => 'success',
                    'message' => 'Thanh toán thành công và hóa đơn đã được cập nhật.',
                    'transaction_code' => $lockedTx->transaction_code,
                ];
            }

            // 12. Giao dịch Thất bại (status = 2)
            $lockedTx->status = TransactionStatus::FAILED;
            $lockedTx->failure_reason = $callbackData['error'] ?? 'Cổng thanh toán báo giao dịch thất bại.';
            $lockedTx->save();

            return [
                'status' => 'failed',
                'message' => 'Giao dịch thanh toán thất bại.',
                'transaction_code' => $lockedTx->transaction_code,
            ];
        });
    }

    /**
     * Hủy giao dịch QR đang chờ (Mục 3.4.5)
     */
    public function cancelQrPayment(Transaction $transaction, ?User $actor = null): Transaction
    {
        return DB::transaction(function () use ($transaction, $actor) {
            $locked = Transaction::lockForUpdate()->find($transaction->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json(['message' => 'Giao dịch không tồn tại.'], 404));
            }

            // Chỉ cho phép hủy khi đang Chờ xử lý (status = 0)
            if ((int) $locked->status !== TransactionStatus::PENDING) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Chỉ có thể hủy giao dịch đang trong trạng thái chờ xử lý.',
                ], 409));
            }

            // Update có điều kiện
            $updated = Transaction::where('id', $locked->id)
                ->where('status', TransactionStatus::PENDING)
                ->update([
                    'status' => TransactionStatus::CANCELLED,
                    'failure_reason' => 'Người dùng chủ động hủy giao dịch.',
                    'updated_at' => Carbon::now(),
                ]);

            if (!$updated) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Trạng thái giao dịch đã thay đổi. Không thể hủy.',
                ], 409));
            }

            // Gọi cổng hủy nếu có
            if ($locked->gateway) {
                try {
                    $this->gatewayManager->gateway($locked->gateway)->cancelOrder($locked);
                } catch (\Throwable $e) {}
            }

            return $locked->fresh();
        });
    }

    /**
     * Hủy giao dịch ghi nhận nhập tay (Mục 3.8 - Chỉ Admin)
     */
    public function cancelManualPayment(Transaction $transaction, string $reason, User $admin): Transaction
    {
        return DB::transaction(function () use ($transaction, $reason, $admin) {
            $locked = Transaction::lockForUpdate()->find($transaction->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json(['message' => 'Giao dịch không tồn tại.'], 404));
            }

            if ($locked->source !== TransactionSource::MANUAL) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Chỉ cho phép hủy trực tiếp các giao dịch ghi nhận nhập tay.',
                ], 422));
            }

            if ((int) $locked->status !== TransactionStatus::SUCCESS) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Chỉ có thể hủy giao dịch đang ở trạng thái thành công.',
                ], 409));
            }

            $locked->status = TransactionStatus::CANCELLED;
            $notePrefix = "[Đã hủy bởi Admin {$admin->name} lúc " . Carbon::now()->format('d/m/Y H:i') . ": " . trim($reason) . "] ";
            $locked->note = $notePrefix . ($locked->note ?? '');
            $locked->save();

            // Đồng bộ lại hóa đơn
            if ($locked->invoice) {
                $lockedInvoice = Invoice::lockForUpdate()->find($locked->invoice_id);
                $lockedInvoice->version = ($lockedInvoice->version ?? 1) + 1;
                $lockedInvoice->updated_by = $admin->id;
                $lockedInvoice->save();

                $this->invoiceService->syncPaymentStatus($lockedInvoice);

                // Kiểm tra lại tính khả dụng BĐS nếu cần
                if ($lockedInvoice->contract) {
                    $this->availabilityService->syncForContract($lockedInvoice->contract);
                }
            }

            return $locked->fresh();
        });
    }

    /**
     * Truy vấn trạng thái đơn từ cổng thanh toán (Polling / Status Check)
     */
    public function checkAndSyncStatus(Transaction $transaction): Transaction
    {
        // Nếu đã ở trạng thái kết thúc (Thành công, Thất bại, Đã hủy, Cần đối soát) -> trả về ngay
        if (in_array((int) $transaction->status, [TransactionStatus::SUCCESS, TransactionStatus::FAILED, TransactionStatus::CANCELLED, TransactionStatus::RECONCILE], true)) {
            return $transaction;
        }

        // Nếu đã quá hạn -> chuyển EXPIRED (4)
        if ($transaction->expires_at && Carbon::parse($transaction->expires_at)->isPast()) {
            Transaction::where('id', $transaction->id)
                ->where('status', TransactionStatus::PENDING)
                ->update(['status' => TransactionStatus::EXPIRED]);

            return $transaction->fresh();
        }

        // Gọi cổng kiểm tra trạng thái
        if ($transaction->gateway) {
            try {
                $gateway = $this->gatewayManager->gateway($transaction->gateway);
                $result = $gateway->queryStatus($transaction);

                if (!empty($result['is_success']) && (int) $result['status'] === TransactionStatus::SUCCESS) {
                    $this->applyGatewayResult($transaction->gateway, [
                        'is_valid' => true,
                        'gateway_order_id' => $transaction->gateway_order_id,
                        'transaction_code' => $transaction->transaction_code,
                        'gateway_txn_id' => $result['gateway_txn_id'] ?? ('QUERY-TXN-' . time()),
                        'amount' => (float) ($result['amount'] ?? $transaction->amount),
                        'status' => TransactionStatus::SUCCESS,
                        'raw_payload' => $result['raw'] ?? [],
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning("Lỗi truy vấn cổng cho giao dịch {$transaction->transaction_code}: " . $e->getMessage());
            }
        }

        return $transaction->fresh();
    }

    /**
     * Báo cho Admin giao dịch cần đối soát thủ công
     */
    protected function notifyAdminReconciliationNeeded(Transaction $transaction, Invoice $invoice, string $reason): void
    {
        $admins = User::where('role_id', 1)->get();
        foreach ($admins as $admin) {
            try {
                DB::table('notifications')->insert([
                    'id' => (string) Str::uuid(),
                    'notifiable_type' => User::class,
                    'notifiable_id' => $admin->id,
                    'type' => 'App\Notifications\PaymentReconciliationNotification',
                    'data' => json_encode([
                        'title' => 'Giao dịch thanh toán cần đối soát thủ công',
                        'message' => "Giao dịch {$transaction->transaction_code} của hóa đơn {$invoice->invoice_no} cần đối soát: {$reason}",
                        'transaction_id' => $transaction->id,
                        'invoice_id' => $invoice->id,
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } catch (\Throwable $e) {}
        }
    }
}
