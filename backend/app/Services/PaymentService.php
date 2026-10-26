<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Transaction;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\TransactionStatus;
use App\Enums\TransactionSource;
use App\Exceptions\StaleVersionException;
use App\Exceptions\DuplicatePaymentSuspectedException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\HttpResponseException;

class PaymentService
{
    protected InvoiceService $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    /**
     * Ghi nhận thanh toán tiền thuê (Mục 3.6, 3.11, 3.12)
     * Điểm vào DUY NHẤT cho ghi nhận thủ công và cổng thanh toán QR sau này.
     *
     * @param Invoice $invoice Hóa đơn tiền thuê cần ghi nhận
     * @param array $data Dữ liệu thanh toán
     * @param string $source 'manual' hoặc 'gateway'
     * @param User|null $actor Người thực hiện ghi nhận
     * @return array ['transaction' => Transaction, 'invoice' => Invoice]
     */
    public function recordPayment(Invoice $invoice, array $data, string $source = TransactionSource::MANUAL, ?User $actor = null): array
    {
        return DB::transaction(function () use ($invoice, $data, $source, $actor) {
            // 1. Khóa bi quan hàng hóa đơn
            $locked = Invoice::lockForUpdate()->find($invoice->id);
            if (!$locked) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Hóa đơn không tồn tại.',
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
                    'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.',
                    new \App\Http\Resources\InvoiceResource($locked->fresh(['contract.property', 'contract.customer', 'items', 'transactions', 'updater']))
                );
            }

            // 4. Kiểm tra loại hóa đơn
            if ($locked->type !== InvoiceType::RENT) {
                throw ValidationException::withMessages([
                    'invoice_id' => ['Chỉ hỗ trợ ghi nhận thanh toán cho hóa đơn tiền thuê.'],
                ]);
            }

            // 5. Kiểm tra trạng thái hóa đơn
            if ($locked->status === InvoiceStatus::CANCELLED) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Không thể ghi nhận thanh toán cho hóa đơn đã hủy.',
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
                    'message' => 'Hóa đơn này đã được thanh toán đủ.',
                ], 409));
            }

            // 6. Kiểm tra số tiền thanh toán
            $amount = round((float) ($data['amount'] ?? 0), 2);
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

            // 7. Kiểm tra ngày thanh toán (paid_at)
            $paidAt = isset($data['paid_at']) ? Carbon::parse($data['paid_at']) : Carbon::now('Asia/Ho_Chi_Minh');
            if ($paidAt->gt(Carbon::now('Asia/Ho_Chi_Minh')->addMinutes(5))) { // Cho phép xê dịch tối đa 5 phút lệch đồng hồ
                throw ValidationException::withMessages([
                    'paid_at' => ['Ngày thanh toán không được ở tương lai.'],
                ]);
            }

            if ($locked->issue_date && $paidAt->lt(Carbon::parse($locked->issue_date)->startOfDay())) {
                throw ValidationException::withMessages([
                    'paid_at' => ['Ngày thanh toán không được trước ngày lập hóa đơn.'],
                ]);
            }

            // 8. Kiểm tra mã tham chiếu duy nhất cho hóa đơn (Mục 3.12c)
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

            // 9. Nghi trùng giao dịch trong 5 phút (Mục 3.12c)
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

            // 12. Tăng version và cập nhật updated_by (thao tác người dùng - Mục 3.12)
            $locked->version = ($locked->version ?? 1) + 1;
            $locked->updated_by = $actor?->id;
            $locked->save();

            // 13. Đồng bộ lại trạng thái hóa đơn
            $this->invoiceService->syncPaymentStatus($locked);

            // 14. Ghi activity log
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

            // 15. Tạo notification cho khách hàng
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
                            'title' => 'Thanh toán tiền thuê đã được ghi nhận',
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
                    // Silently ignore notification error if any
                }
            }

            return [
                'transaction' => $transaction,
                'invoice' => $locked->fresh(['contract.property', 'contract.customer', 'updater']),
                'is_duplicate' => false,
            ];
        }, 3);
    }
}
