<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Enums\TransactionSource;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Contract;
use App\Models\ContractDeposit;
use App\Models\ContractDocument;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\DepositNotification;
use App\Queries\DepositQuery;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DepositService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected PaymentService $paymentService,
        protected DepositQuery $depositQuery
    ) {
    }

    /**
     * Đảm bảo hợp đồng có deposit_amount > 0 luôn có đúng 1 bản ghi contract_deposits và 1 hóa đơn type = deposit
     */
    public function ensureDepositForContract(Contract $contract, ?int $actorId = null): ?ContractDeposit
    {
        $depositAmount = round((float) ($contract->deposit_amount ?? 0), 2);
        if ($depositAmount <= 0) {
            return null;
        }

        return DB::transaction(function () use ($contract, $depositAmount, $actorId) {
            $lockedContract = Contract::where('id', $contract->id)->lockForUpdate()->firstOrFail();

            // 1. Tìm hoặc tạo hóa đơn deposit hoạt động duy nhất của hợp đồng
            $depositInvoice = Invoice::where('contract_id', $lockedContract->id)
                ->where('type', InvoiceType::DEPOSIT)
                ->where('status', '!=', InvoiceStatus::CANCELLED)
                ->orderByDesc('paid_amount')
                ->orderBy('id', 'asc')
                ->lockForUpdate()
                ->first();

            if (!$depositInvoice) {
                $propCode = 'BĐS';
                if ($lockedContract->property && !empty($lockedContract->property->code)) {
                    $propCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $lockedContract->property->code));
                }
                $ym = Carbon::now('Asia/Ho_Chi_Minh')->format('Ym');
                $invoiceNo = "QLTT-INV-{$ym}-{$propCode}-DEP" . $lockedContract->id;
                while (Invoice::withTrashed()->where('invoice_no', $invoiceNo)->exists()) {
                    $invoiceNo = "QLTT-INV-{$ym}-{$propCode}-DEP" . $lockedContract->id . '-' . strtoupper(Str::random(3));
                }

                $issueDate = $lockedContract->start_date
                    ? Carbon::parse($lockedContract->start_date)->toDateString()
                    : Carbon::today('Asia/Ho_Chi_Minh')->toDateString();
                $dueDate = Carbon::parse($issueDate)->addDays(3)->toDateString();

                $depositInvoice = Invoice::create([
                    'invoice_no' => $invoiceNo,
                    'contract_id' => $lockedContract->id,
                    'issue_date' => $issueDate,
                    'due_date' => $dueDate,
                    'title' => 'Tiền đặt cọc hợp đồng ' . $lockedContract->contract_code,
                    'type' => InvoiceType::DEPOSIT,
                    'amount' => $depositAmount,
                    'paid_amount' => 0,
                    'status' => InvoiceStatus::UNPAID,
                    'version' => 1,
                    'note' => 'Hóa đơn thu tiền đặt cọc bảo đảm thực hiện hợp đồng.',
                    'created_by' => $actorId ?? $lockedContract->broker_id,
                    'updated_by' => $actorId ?? $lockedContract->broker_id,
                ]);

                InvoiceItem::create([
                    'invoice_id' => $depositInvoice->id,
                    'item_name' => 'Tiền đặt cọc bảo đảm hợp đồng ' . $lockedContract->contract_code,
                    'quantity' => 1,
                    'unit_price' => $depositAmount,
                    'total_price' => $depositAmount,
                    'description' => 'Khoản tiền đặt cọc theo hợp đồng',
                    'sort_order' => 1,
                ]);
            }

            // 2. Tìm hoặc tạo bản ghi contract_deposits
            $deposit = ContractDeposit::withTrashed()
                ->where('contract_id', $lockedContract->id)
                ->lockForUpdate()
                ->first();

            if ($deposit) {
                if ($deposit->trashed()) {
                    $deposit->restore();
                }
                if (!$deposit->invoice_id) {
                    $deposit->invoice_id = $depositInvoice->id;
                    $deposit->save();
                }
            } else {
                $deposit = ContractDeposit::create([
                    'contract_id' => $lockedContract->id,
                    'invoice_id' => $depositInvoice->id,
                    'required_amount' => $depositAmount,
                    'refund_due_date' => $lockedContract->end_date
                        ? Carbon::parse($lockedContract->end_date)->toDateString()
                        : null,
                    'notes' => null,
                    'version' => 1,
                    'created_by' => $actorId ?? $lockedContract->broker_id,
                    'updated_by' => $actorId ?? $lockedContract->broker_id,
                ]);
            }

            // Đồng bộ lại trạng thái thanh toán của hóa đơn deposit
            $this->invoiceService->syncPaymentStatus($depositInvoice);

            return $deposit;
        });
    }

    /**
     * Ghi nhận THU TIỀN CỌC (Mục 3.6 - Tab Thu cọc)
     * Tái sử dụng hoàn toàn PaymentService::recordPayment trên hóa đơn deposit của khoản cọc.
     */
    public function collectDeposit(ContractDeposit $deposit, array $data, User $actor): array
    {
        // Đảm bảo đã có hóa đơn deposit liên kết
        if (!$deposit->invoice_id) {
            $deposit->loadMissing('contract');
            if ($deposit->contract) {
                $deposit = $this->ensureDepositForContract($deposit->contract, $actor->id) ?? $deposit;
            }
        }

        $contract = Contract::findOrFail($deposit->contract_id);

        // Không thu cọc cho hợp đồng đã hủy (status = 3)
        if ((int) $contract->status === 3) {
            throw new HttpResponseException(response()->json([
                'code' => 'INVALID_STATE',
                'message' => __('spec_messages.row_20_contract_invalid'),
            ], 409));
        }

        // Kiểm tra client_token idempotency trước khi xử lý
        $clientToken = !empty($data['client_token']) ? trim($data['client_token']) : null;
        if ($clientToken && $deposit->invoice_id) {
            $existingTx = Transaction::where('client_token', $clientToken)
                ->where('invoice_id', $deposit->invoice_id)
                ->first();
            if ($existingTx) {
                $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
                return [
                    'deposit' => $freshDeposit,
                    'transaction' => $existingTx,
                    'message' => __('spec_messages.row_19_deposit_success'),
                    'idempotent' => true,
                ];
            }
        }

        // Kiểm tra optimistic lock trên contract_deposits nếu client gửi deposit_version / version
        if (isset($data['version'])) {
            $expectedVersion = (int) $data['version'];
            if ((int) $deposit->version !== $expectedVersion) {
                $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
                throw new HttpResponseException(response()->json([
                    'code' => 'STALE_VERSION',
                    'message' => __('spec_messages.row_2_stale_version'),
                    'current_data' => $freshDeposit,
                ], 409));
            }
        }

        $currentDeposit = $this->depositQuery->findWithMetrics($deposit->id);
        $remaining = (float) $currentDeposit->remaining_to_collect;

        if ($remaining <= 0) {
            throw new HttpResponseException(response()->json([
                'code' => 'INVALID_STATE',
                'message' => __('spec_messages.deposit_already_fully_collected'),
                'current_data' => $currentDeposit,
            ], 409));
        }

        $amount = round((float) ($data['amount'] ?? 0), 2);
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => [__('spec_messages.row_20_amount_positive')],
            ]);
        }

        if ($amount > $remaining) {
            $remFormatted = number_format($remaining, 0, ',', '.') . ' VNĐ';
            throw ValidationException::withMessages([
                'amount' => [__('spec_messages.deposit_collect_exceeds_remaining', ['remaining' => $remFormatted])],
            ]);
        }

        $invoice = Invoice::findOrFail($deposit->invoice_id);

        // Ủy quyền ghi nhận giao dịch thu cho PaymentService::recordPayment
        $paymentResult = $this->paymentService->recordPayment($invoice, [
            'version' => $invoice->version,
            'amount' => $amount,
            'payment_method' => $data['payment_method'],
            'paid_at' => $data['paid_at'] ?? Carbon::now('Asia/Ho_Chi_Minh')->toIso8601String(),
            'reference_code' => $data['reference_code'] ?? null,
            'note' => $data['note'] ?? null,
            'client_token' => $clientToken,
            'confirm_duplicate' => !empty($data['confirm_duplicate']),
        ], $actor->id);

        /** @var Transaction $tx */
        $tx = $paymentResult['transaction'];

        // Tăng version của contract_deposits
        ContractDeposit::where('id', $deposit->id)->update([
            'version' => DB::raw('version + 1'),
            'updated_by' => $actor->id,
            'updated_at' => Carbon::now(),
        ]);

        $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);

        // Ghi activity_logs
        $this->logActivity($actor->id, 'DEPOSIT_COLLECTED', $deposit->id, null, [
            'contract_id' => $deposit->contract_id,
            'invoice_id' => $deposit->invoice_id,
            'transaction_id' => $tx->id,
            'amount' => $amount,
            'payment_method' => $tx->payment_method,
            'collected_amount' => $freshDeposit->collected_amount,
            'held_amount' => $freshDeposit->held_amount,
        ]);

        // Tự động sinh PDF "Phiếu thu cọc" đính kèm vào chứng từ hợp đồng nếu bật cấu hình
        if (config('deposit.auto_generate_receipt_pdf', true)) {
            $this->generateReceiptDocument(
                $freshDeposit,
                [$tx],
                'PHIẾU THU TIỀN ĐẶT CỌC',
                "Phiếu thu tiền cọc - {$tx->transaction_code}",
                $actor
            );
            $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
        }

        // Gửi thông báo cho khách hàng
        $this->notifyCustomerDepositCollected($freshDeposit, $tx);

        return [
            'deposit' => $freshDeposit,
            'transaction' => $tx,
            'message' => __('spec_messages.row_19_deposit_success'),
            'idempotent' => $paymentResult['idempotent'] ?? false,
        ];
    }

    /**
     * Ghi nhận HOÀN TRẢ và/hoặc KHẤU TRỪ TIỀN CỌC (Mục 3.6 - Tab Hoàn trả cọc)
     */
    public function refundDeposit(ContractDeposit $deposit, array $data, User $actor): array
    {
        $clientToken = !empty($data['client_token']) ? trim($data['client_token']) : null;

        // 1. Idempotency theo client_token
        if ($clientToken && $deposit->invoice_id) {
            $existingTx = Transaction::where('invoice_id', $deposit->invoice_id)
                ->whereIn('client_token', [$clientToken, substr($clientToken, 0, 34) . '-R', substr($clientToken, 0, 34) . '-D'])
                ->first();
            if ($existingTx) {
                $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
                return [
                    'deposit' => $freshDeposit,
                    'transactions' => [$existingTx],
                    'message' => __('spec_messages.row_19_deposit_success'),
                    'idempotent' => true,
                ];
            }
        }

        $result = DB::transaction(function () use ($deposit, $data, $actor, $clientToken) {
            // 2. Khóa theo đúng thứ tự: contracts -> contract_deposits -> invoices -> transactions
            $lockedContract = Contract::where('id', $deposit->contract_id)->lockForUpdate()->firstOrFail();
            $lockedDeposit = ContractDeposit::where('id', $deposit->id)->lockForUpdate()->firstOrFail();

            if (!$lockedDeposit->invoice_id) {
                throw new HttpResponseException(response()->json([
                    'code' => 'INVALID_STATE',
                    'message' => __('spec_messages.deposit_nothing_held'),
                ], 409));
            }

            $lockedInvoice = Invoice::where('id', $lockedDeposit->invoice_id)->lockForUpdate()->firstOrFail();

            // Khóa các dòng giao dịch của hóa đơn cọc
            $txRows = Transaction::where('invoice_id', $lockedInvoice->id)
                ->whereNull('deleted_at')
                ->lockForUpdate()
                ->get();

            // 3. Kiểm tra optimistic locking version của contract_deposits
            if (isset($data['version'])) {
                $expectedVersion = (int) $data['version'];
                if ((int) $lockedDeposit->version !== $expectedVersion) {
                    $freshDeposit = $this->depositQuery->findWithMetrics($lockedDeposit->id);
                    throw new HttpResponseException(response()->json([
                        'code' => 'STALE_VERSION',
                        'message' => __('spec_messages.row_2_stale_version'),
                        'current_data' => $freshDeposit,
                    ], 409));
                }
            }

            // 4. Tính đại lượng dẫn xuất BÊN TRONG khóa
            $collected = (float) $txRows
                ->filter(fn ($t) => (int) $t->status === TransactionStatus::SUCCESS && in_array($t->type, [null, '', TransactionType::PAYMENT], true))
                ->sum('amount');
            $refunded = (float) $txRows
                ->filter(fn ($t) => (int) $t->status === TransactionStatus::SUCCESS && $t->type === TransactionType::DEPOSIT_REFUND)
                ->sum('amount');
            $deducted = (float) $txRows
                ->filter(fn ($t) => (int) $t->status === TransactionStatus::SUCCESS && $t->type === TransactionType::DEPOSIT_DEDUCTION)
                ->sum('amount');

            $held = max(0.0, round($collected - $refunded - $deducted, 2));

            if ($held <= 0) {
                $freshDeposit = $this->depositQuery->findWithMetrics($lockedDeposit->id);
                throw new HttpResponseException(response()->json([
                    'code' => 'INVALID_STATE',
                    'message' => __('spec_messages.deposit_nothing_held'),
                    'current_data' => $freshDeposit,
                ], 409));
            }

            // 5. Kiểm tra số tiền hoàn trả và khấu trừ
            $refundAmount = round((float) ($data['refund_amount'] ?? 0), 2);
            $deductionAmount = round((float) ($data['deduction_amount'] ?? 0), 2);
            $totalOut = round($refundAmount + $deductionAmount, 2);

            if ($totalOut <= 0) {
                throw ValidationException::withMessages([
                    'refund_amount' => [__('spec_messages.row_20_amount_positive')],
                ]);
            }

            if ($totalOut > $held) {
                // Nguyên văn dòng 19 BẢNG LỖI của spec
                throw ValidationException::withMessages([
                    'refund_amount' => [__('spec_messages.row_19_deposit_exceed')],
                ]);
            }

            $deductionReason = isset($data['deduction_reason']) ? trim($data['deduction_reason']) : '';
            if ($deductionAmount > 0 && $deductionReason === '') {
                throw ValidationException::withMessages([
                    'deduction_reason' => [__('spec_messages.deposit_deduction_reason_required')],
                ]);
            }

            // 6. Kiểm tra điều kiện hợp đồng đến hạn hoàn trả hay hoàn sớm
            $threshold = DepositQuery::getRefundDueThresholdDate();
            $endDateRaw = $lockedDeposit->refund_due_date ?? $lockedContract->end_date;
            $dueDateStr = $endDateRaw ? Carbon::parse($endDateRaw)->toDateString() : null;
            $isContractEnded = in_array((int) $lockedContract->status, [2, 3], true)
                || ($dueDateStr !== null && $dueDateStr <= $threshold);

            $note = isset($data['note']) ? trim($data['note']) : '';
            $earlyReason = isset($data['early_refund_reason']) ? trim($data['early_refund_reason']) : '';
            $combinedEarlyReason = $earlyReason !== '' ? $earlyReason : ($note !== '' ? $note : $deductionReason);

            if (!$isContractEnded) {
                if (!config('deposit.allow_early_refund', true) || (int) $actor->role_id !== 1) {
                    throw new HttpResponseException(response()->json([
                        'code' => 'INVALID_STATE',
                        'message' => __('spec_messages.deposit_contract_not_ended'),
                    ], 409));
                }

                if ($combinedEarlyReason === '') {
                    throw ValidationException::withMessages([
                        'note' => [__('spec_messages.deposit_early_refund_reason_required')],
                    ]);
                }
            }

            $paymentMethod = $data['payment_method'] ?? PaymentMethod::BANK_TRANSFER;
            $referenceCode = !empty($data['reference_code']) ? trim($data['reference_code']) : null;
            $paidAt = !empty($data['paid_at'])
                ? Carbon::parse($data['paid_at'])
                : Carbon::now('Asia/Ho_Chi_Minh');

            // 7. Kiểm tra reference_code trùng trên cùng hóa đơn
            if ($referenceCode !== null) {
                $dupRef = $txRows->first(fn ($t) => $t->reference_code === $referenceCode);
                if ($dupRef) {
                    throw ValidationException::withMessages([
                        'reference_code' => ['Mã tham chiếu giao dịch đã tồn tại trên khoản cọc này.'],
                    ]);
                }
            }

            // 8. Kiểm tra nghi ngờ gửi trùng trong 5 phút (cùng số tiền, cùng phương thức, không có mã tham chiếu)
            if ($referenceCode === null && empty($data['confirm_duplicate'])) {
                $fiveMinutesAgo = Carbon::now()->subMinutes(5);
                $checkAmt = $refundAmount > 0 ? $refundAmount : $deductionAmount;
                $checkType = $refundAmount > 0 ? TransactionType::DEPOSIT_REFUND : TransactionType::DEPOSIT_DEDUCTION;

                $suspected = $txRows->first(function ($t) use ($checkAmt, $checkType, $paymentMethod, $fiveMinutesAgo) {
                    return (int) $t->status === TransactionStatus::SUCCESS
                        && $t->type === $checkType
                        && round((float) $t->amount, 2) === $checkAmt
                        && $t->payment_method === $paymentMethod
                        && $t->created_at && Carbon::parse($t->created_at)->gte($fiveMinutesAgo);
                });

                if ($suspected) {
                    throw new HttpResponseException(response()->json([
                        'code' => 'DUPLICATE_SUSPECTED',
                        'message' => __('spec_messages.deposit_duplicate_suspected'),
                    ], 409));
                }
            }

            // 9. Tạo bản ghi giao dịch hoàn trả và/hoặc khấu trừ
            $createdTransactions = [];
            $dateStr = $paidAt->format('Ymd');

            if ($refundAmount > 0) {
                $refundToken = ($deductionAmount > 0 && $clientToken)
                    ? substr($clientToken, 0, 34) . '-R'
                    : $clientToken;

                $txRefund = Transaction::create([
                    'invoice_id' => $lockedInvoice->id,
                    'type' => TransactionType::DEPOSIT_REFUND,
                    'transaction_code' => 'DEP-REF-' . $dateStr . '-' . strtoupper(Str::random(6)),
                    'amount' => $refundAmount,
                    'source' => TransactionSource::MANUAL,
                    'status' => TransactionStatus::SUCCESS,
                    'payment_method' => $paymentMethod,
                    'reference_code' => $referenceCode,
                    'paid_at' => $paidAt,
                    'note' => $note ?: null,
                    'reason' => !$isContractEnded ? $combinedEarlyReason : ($earlyReason ?: null),
                    'recorded_by' => $actor->id,
                    'client_token' => $refundToken,
                ]);
                $createdTransactions[] = $txRefund;
            }

            if ($deductionAmount > 0) {
                $deductToken = ($refundAmount > 0 && $clientToken)
                    ? substr($clientToken, 0, 34) . '-D'
                    : $clientToken;

                $txDeduct = Transaction::create([
                    'invoice_id' => $lockedInvoice->id,
                    'type' => TransactionType::DEPOSIT_DEDUCTION,
                    'transaction_code' => 'DEP-DED-' . $dateStr . '-' . strtoupper(Str::random(6)),
                    'amount' => $deductionAmount,
                    'source' => TransactionSource::MANUAL,
                    'status' => TransactionStatus::SUCCESS,
                    'payment_method' => $paymentMethod,
                    'reference_code' => $refundAmount > 0 ? null : $referenceCode,
                    'paid_at' => $paidAt,
                    'note' => $note ?: null,
                    'reason' => $deductionReason,
                    'recorded_by' => $actor->id,
                    'client_token' => $deductToken,
                ]);
                $createdTransactions[] = $txDeduct;
            }

            // 10. Tăng version có điều kiện trên contract_deposits
            $affected = DB::table('contract_deposits')
                ->where('id', $lockedDeposit->id)
                ->where('version', $lockedDeposit->version)
                ->update([
                    'version' => $lockedDeposit->version + 1,
                    'updated_by' => $actor->id,
                    'updated_at' => Carbon::now(),
                ]);

            if ($affected === 0) {
                $freshDeposit = $this->depositQuery->findWithMetrics($lockedDeposit->id);
                throw new HttpResponseException(response()->json([
                    'code' => 'STALE_VERSION',
                    'message' => __('spec_messages.row_2_stale_version'),
                    'current_data' => $freshDeposit,
                ], 409));
            }

            // Đảm bảo paid_amount của hóa đơn deposit không bị ảnh hưởng bởi giao dịch hoàn/khấu trừ
            $this->invoiceService->syncPaymentStatus($lockedInvoice->fresh());

            return [
                'created_transactions' => $createdTransactions,
                'old_held' => $held,
                'refund_amount' => $refundAmount,
                'deduction_amount' => $deductionAmount,
            ];
        });

        $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
        $createdTransactions = $result['created_transactions'];

        // Ghi activity_logs
        $actionName = $result['refund_amount'] > 0 && $result['deduction_amount'] > 0
            ? 'DEPOSIT_REFUNDED_AND_DEDUCTED'
            : ($result['refund_amount'] > 0 ? 'DEPOSIT_REFUNDED' : 'DEPOSIT_DEDUCTED');

        $this->logActivity($actor->id, $actionName, $deposit->id, ['held_amount' => $result['old_held']], [
            'refund_amount' => $result['refund_amount'],
            'deduction_amount' => $result['deduction_amount'],
            'new_held_amount' => $freshDeposit->held_amount,
            'transaction_ids' => collect($createdTransactions)->pluck('id')->all(),
        ]);

        // Tự động sinh PDF "Phiếu hoàn trả / quyết toán tiền cọc" nếu bật cấu hình
        if (config('deposit.auto_generate_receipt_pdf', true)) {
            $firstCode = $createdTransactions[0]->transaction_code ?? 'REF';
            $this->generateReceiptDocument(
                $freshDeposit,
                $createdTransactions,
                'PHIẾU HOÀN TRẢ & QUYẾT TOÁN TIỀN CỌC',
                "Phiếu hoàn trả tiền cọc - {$firstCode}",
                $actor
            );
            $freshDeposit = $this->depositQuery->findWithMetrics($deposit->id);
        }

        // Gửi thông báo cho khách hàng
        $this->notifyCustomerDepositRefunded($freshDeposit, $result['refund_amount'], $result['deduction_amount']);

        return [
            'deposit' => $freshDeposit,
            'transactions' => $createdTransactions,
            'message' => __('spec_messages.row_19_deposit_success'),
            'idempotent' => false,
        ];
    }

    /**
     * Chỉnh sửa thông tin khoản cọc (Mục 3.7b)
     */
    public function updateDeposit(ContractDeposit $deposit, array $data, User $actor): ContractDeposit
    {
        DB::transaction(function () use ($deposit, $data, $actor) {
            $lockedContract = Contract::where('id', $deposit->contract_id)->lockForUpdate()->firstOrFail();
            $lockedDeposit = ContractDeposit::where('id', $deposit->id)->lockForUpdate()->firstOrFail();
            $lockedInvoice = $lockedDeposit->invoice_id
                ? Invoice::where('id', $lockedDeposit->invoice_id)->lockForUpdate()->first()
                : null;

            $expectedVersion = (int) ($data['version'] ?? 0);
            if ((int) $lockedDeposit->version !== $expectedVersion) {
                $freshDeposit = $this->depositQuery->findWithMetrics($lockedDeposit->id);
                throw new HttpResponseException(response()->json([
                    'code' => 'STALE_VERSION',
                    'message' => __('spec_messages.row_2_stale_version'),
                    'current_data' => $freshDeposit,
                ], 409));
            }

            $collected = 0.0;
            if ($lockedInvoice) {
                $collected = (float) Transaction::where('invoice_id', $lockedInvoice->id)
                    ->where('status', TransactionStatus::SUCCESS)
                    ->where(function ($q) {
                        $q->where('type', TransactionType::PAYMENT)->orWhereNull('type');
                    })
                    ->whereNull('deleted_at')
                    ->lockForUpdate()
                    ->sum('amount');
            }

            $oldData = [
                'required_amount' => (float) $lockedDeposit->required_amount,
                'refund_due_date' => $lockedDeposit->refund_due_date?->toDateString(),
                'notes' => $lockedDeposit->notes,
            ];

            $updateFields = [
                'version' => $lockedDeposit->version + 1,
                'updated_by' => $actor->id,
                'updated_at' => Carbon::now(),
            ];

            // Kiểm tra thay đổi số tiền cọc cam kết
            if (isset($data['required_amount'])) {
                $newRequired = round((float) $data['required_amount'], 2);
                $curRequired = round((float) $lockedDeposit->required_amount, 2);

                if ($newRequired !== $curRequired) {
                    if ($collected > 0) {
                        throw new HttpResponseException(response()->json([
                            'code' => 'INVALID_STATE',
                            'message' => __('spec_messages.deposit_cannot_edit_amount_after_collection'),
                        ], 409));
                    }

                    $updateFields['required_amount'] = $newRequired;

                    // Đồng bộ sang contracts.deposit_amount và invoices.amount
                    $lockedContract->deposit_amount = $newRequired;
                    $lockedContract->is_high_value = Contract::isHighValue($lockedContract->rental_price, $newRequired);
                    $lockedContract->save();

                    if ($lockedInvoice) {
                        $lockedInvoice->amount = $newRequired;
                        $lockedInvoice->version = (int) $lockedInvoice->version + 1;
                        $lockedInvoice->updated_by = $actor->id;
                        $lockedInvoice->save();

                        $firstItem = $lockedInvoice->items()->first();
                        if ($firstItem) {
                            $firstItem->update([
                                'unit_price' => $newRequired,
                                'total_price' => $newRequired,
                            ]);
                        }
                        $this->invoiceService->syncPaymentStatus($lockedInvoice);
                    }
                }
            }

            if (array_key_exists('refund_due_date', $data)) {
                $updateFields['refund_due_date'] = !empty($data['refund_due_date'])
                    ? Carbon::parse($data['refund_due_date'])->toDateString()
                    : null;
            }

            if (array_key_exists('notes', $data)) {
                $updateFields['notes'] = $data['notes'] !== null ? trim($data['notes']) : null;
            }

            $affected = DB::table('contract_deposits')
                ->where('id', $lockedDeposit->id)
                ->where('version', $lockedDeposit->version)
                ->update($updateFields);

            if ($affected === 0) {
                $freshDeposit = $this->depositQuery->findWithMetrics($lockedDeposit->id);
                throw new HttpResponseException(response()->json([
                    'code' => 'STALE_VERSION',
                    'message' => __('spec_messages.row_2_stale_version'),
                    'current_data' => $freshDeposit,
                ], 409));
            }

            $this->logActivity($actor->id, 'DEPOSIT_UPDATED', $lockedDeposit->id, $oldData, $updateFields);
        });

        return $this->depositQuery->findWithMetrics($deposit->id);
    }

    /**
     * Hủy (void) một giao dịch hoàn trả hoặc khấu trừ tiền cọc bị nhập nhầm (Mục 5 - Admin only)
     */
    public function voidMovement(Transaction $transaction, string $reason, User $actor): ContractDeposit
    {
        $deposit = ContractDeposit::where('invoice_id', $transaction->invoice_id)->firstOrFail();

        if (!in_array($transaction->type, [TransactionType::DEPOSIT_REFUND, TransactionType::DEPOSIT_DEDUCTION], true)) {
            throw new HttpResponseException(response()->json([
                'code' => 'INVALID_STATE',
                'message' => 'Chỉ hỗ trợ hủy giao dịch hoàn trả hoặc khấu trừ tiền cọc tại chức năng này.',
            ], 409));
        }

        if ((int) $transaction->status !== TransactionStatus::SUCCESS) {
            throw new HttpResponseException(response()->json([
                'code' => 'INVALID_STATE',
                'message' => 'Giao dịch này đã bị hủy hoặc không ở trạng thái thành công.',
            ], 409));
        }

        DB::transaction(function () use ($deposit, $transaction, $reason, $actor) {
            Contract::where('id', $deposit->contract_id)->lockForUpdate()->first();
            $lockedDeposit = ContractDeposit::where('id', $deposit->id)->lockForUpdate()->firstOrFail();
            $lockedInvoice = Invoice::where('id', $deposit->invoice_id)->lockForUpdate()->firstOrFail();
            $lockedTx = Transaction::where('id', $transaction->id)->lockForUpdate()->firstOrFail();

            if ((int) $lockedTx->status !== TransactionStatus::SUCCESS) {
                throw new HttpResponseException(response()->json([
                    'code' => 'INVALID_STATE',
                    'message' => 'Giao dịch này đã được hủy trước đó.',
                ], 409));
            }

            $oldData = $lockedTx->toArray();

            $lockedTx->update([
                'status' => TransactionStatus::CANCELLED,
                'failure_reason' => trim($reason),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('contract_deposits')
                ->where('id', $lockedDeposit->id)
                ->update([
                    'version' => $lockedDeposit->version + 1,
                    'updated_by' => $actor->id,
                    'updated_at' => Carbon::now(),
                ]);

            $this->invoiceService->syncPaymentStatus($lockedInvoice);

            $this->logActivity($actor->id, 'DEPOSIT_MOVEMENT_VOIDED', $lockedDeposit->id, $oldData, [
                'transaction_id' => $lockedTx->id,
                'void_reason' => trim($reason),
            ]);
        });

        return $this->depositQuery->findWithMetrics($deposit->id);
    }

    /**
     * Tự động sinh PDF biên nhận tiền cọc và lưu vào bảng contract_documents (type = 6)
     */
    protected function generateReceiptDocument(
        ContractDeposit $deposit,
        array $transactions,
        string $receiptTitle,
        string $docTitle,
        User $actor
    ): ?ContractDocument {
        try {
            $contract = $deposit->contract ?? Contract::with(['property', 'customer'])->find($deposit->contract_id);
            if (!$contract) {
                return null;
            }

            // Tôn trọng giới hạn tối đa 20 tài liệu / hợp đồng
            $docCount = ContractDocument::where('contract_id', $contract->id)->whereNull('deleted_at')->count();
            if ($docCount >= ContractDocument::MAX_FILES_PER_CONTRACT) {
                return null;
            }

            $metrics = DepositQuery::computeMetrics($deposit);

            $pdf = Pdf::loadView('invoices.deposit_receipt_pdf', [
                'receiptTitle' => $receiptTitle,
                'contract' => $contract,
                'property' => $contract->property,
                'customer' => $contract->customer,
                'deposit' => $deposit,
                'transactions' => $transactions,
                'metrics' => $metrics,
                'actor' => $actor,
            ]);
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

            $output = $pdf->output();
            $uuidFileName = (string) Str::uuid() . '.pdf';
            $relativePath = "contracts/{$contract->id}/{$uuidFileName}";

            Storage::disk('local')->put($relativePath, $output);
            $fileSize = strlen($output);
            $origName = Str::slug($docTitle) . '.pdf';

            return ContractDocument::create([
                'contract_id' => $contract->id,
                'document_type' => ContractDocument::TYPE_DEPOSIT_RECEIPT,
                'title' => $docTitle,
                'file_url' => $relativePath,
                'original_name' => $origName,
                'file_size' => $fileSize,
                'mime_type' => 'application/pdf',
                'description' => 'Chứng từ điện tử tự động sinh khi ghi nhận giao dịch tiền cọc.',
                'uploaded_by' => $actor->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Không thể tự động sinh PDF biên nhận tiền cọc: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Gửi thông báo cho khách hàng khi thu tiền cọc
     */
    protected function notifyCustomerDepositCollected(ContractDeposit $deposit, Transaction $tx): void
    {
        try {
            $contract = $deposit->contract ?? Contract::with('customer')->find($deposit->contract_id);
            $customer = $contract?->customer;
            if (!$customer) {
                return;
            }

            $amtFormatted = number_format((float) $tx->amount, 0, ',', '.') . ' VNĐ';
            $customer->notify(new DepositNotification(
                $deposit,
                "Xác nhận thu tiền cọc hợp đồng {$contract->contract_code}",
                "Hệ thống đã ghi nhận khoản thu tiền cọc {$amtFormatted} cho hợp đồng '{$contract->contract_name}'.",
                'deposit_collected',
                [
                    'transaction_id' => $tx->id,
                    'amount' => (float) $tx->amount,
                    'held_amount' => (float) $deposit->held_amount,
                ]
            ));
        } catch (\Throwable $e) {
            Log::warning('Lỗi gửi thông báo thu tiền cọc: ' . $e->getMessage());
        }
    }

    /**
     * Gửi thông báo cho khách hàng khi hoàn trả / khấu trừ tiền cọc
     */
    protected function notifyCustomerDepositRefunded(
        ContractDeposit $deposit,
        float $refundAmount,
        float $deductionAmount
    ): void {
        try {
            $contract = $deposit->contract ?? Contract::with('customer')->find($deposit->contract_id);
            $customer = $contract?->customer;
            if (!$customer) {
                return;
            }

            $parts = [];
            if ($refundAmount > 0) {
                $parts[] = 'hoàn trả ' . number_format($refundAmount, 0, ',', '.') . ' VNĐ';
            }
            if ($deductionAmount > 0) {
                $parts[] = 'khấu trừ ' . number_format($deductionAmount, 0, ',', '.') . ' VNĐ';
            }
            $summaryText = implode(' và ', $parts);

            $customer->notify(new DepositNotification(
                $deposit,
                "Thông báo quyết toán / hoàn trả tiền cọc {$contract->contract_code}",
                "Hợp đồng '{$contract->contract_name}' vừa được ghi nhận {$summaryText}. Số tiền cọc đang giữ còn lại: " . number_format((float) $deposit->held_amount, 0, ',', '.') . ' VNĐ.',
                'deposit_refunded',
                [
                    'refund_amount' => $refundAmount,
                    'deduction_amount' => $deductionAmount,
                    'held_amount' => (float) $deposit->held_amount,
                ]
            ));
        } catch (\Throwable $e) {
            Log::warning('Lỗi gửi thông báo hoàn tiền cọc: ' . $e->getMessage());
        }
    }

    /**
     * Ghi nhận activity_logs an toàn
     */
    protected function logActivity(?int $userId, string $action, int $recordId, ?array $oldData, ?array $newData): void
    {
        try {
            if (Schema::hasTable('activity_logs')) {
                DB::table('activity_logs')->insert([
                    'user_id' => $userId,
                    'action' => $action,
                    'table_name' => 'contract_deposits',
                    'record_id' => $recordId,
                    'old_data' => $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null,
                    'new_data' => $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null,
                    'ip_address' => request()?->ip(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning("Không thể ghi activity_logs cho action {$action}: " . $e->getMessage());
        }
    }
}

