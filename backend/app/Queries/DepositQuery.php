<?php

namespace App\Queries;

use App\Enums\DepositDisplayStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\ContractDeposit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DepositQuery
{
    /**
     * Ngày ngưỡng tính "Cần hoàn trả" (hôm nay + số ngày báo trước trong config/deposit.php)
     */
    public static function getRefundDueThresholdDate(): string
    {
        $noticeDays = (int) config('deposit.refund_due_notice_days', 0);
        return Carbon::today('Asia/Ho_Chi_Minh')->addDays($noticeDays)->toDateString();
    }

    /**
     * Escape ký tự đặc biệt trong LIKE search
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /**
     * Tính đại lượng dẫn xuất và display_status cho 1 bản ghi ContractDeposit (hoặc stdClass từ query)
     * Đây là HÀM DUY NHẤT tính display_status dùng chung cho Danh sách, Thẻ thống kê, Chi tiết và Bộ lọc.
     */
    public static function computeMetrics(object $row, ?string $thresholdDate = null): array
    {
        $thresholdDate = $thresholdDate ?? self::getRefundDueThresholdDate();

        $required = round((float) ($row->required_amount ?? 0), 2);
        $collected = round((float) ($row->collected_amount ?? 0), 2);
        $refunded = round((float) ($row->refunded_amount ?? 0), 2);
        $deducted = round((float) ($row->deducted_amount ?? 0), 2);

        $held = max(0.0, round($collected - $refunded - $deducted, 2));
        $remainingToCollect = max(0.0, round($required - $collected, 2));

        $contractStatus = (int) ($row->contract_status ?? $row->contract?->status ?? 1);
        $endDateRaw = $row->refund_due_date
            ?? $row->contract_end_date
            ?? $row->contract?->end_date
            ?? null;
        $dueDateStr = $endDateRaw ? Carbon::parse($endDateRaw)->toDateString() : null;

        // Đến hạn hoàn trả khi HĐ ở status 2 (Hết hạn/Thanh lý) hoặc 3 (Đã hủy), hoặc hạn hoàn trả/end_date <= ngưỡng
        $isRefundDueCondition = in_array($contractStatus, [2, 3], true)
            || ($dueDateStr !== null && $dueDateStr <= $thresholdDate);

        if ($collected <= 0) {
            $displayStatus = DepositDisplayStatus::UNPAID;
        } elseif ($held <= 0 && $refunded > 0) {
            $displayStatus = DepositDisplayStatus::REFUNDED;
        } elseif ($held <= 0 && $deducted > 0) {
            $displayStatus = DepositDisplayStatus::DEDUCTED;
        } elseif ($held > 0 && ($refunded + $deducted) > 0) {
            $displayStatus = DepositDisplayStatus::PARTIAL_REFUNDED;
        } elseif ($held > 0 && $isRefundDueCondition) {
            $displayStatus = DepositDisplayStatus::REFUND_DUE;
        } elseif ($collected > 0 && $collected < $required) {
            $displayStatus = DepositDisplayStatus::PARTIAL_COLLECTED;
        } else {
            $displayStatus = DepositDisplayStatus::HOLDING;
        }

        return [
            'required_amount' => $required,
            'collected_amount' => $collected,
            'refunded_amount' => $refunded,
            'deducted_amount' => $deducted,
            'held_amount' => $held,
            'remaining_to_collect' => $remainingToCollect,
            'is_refund_due' => $held > 0 && $isRefundDueCondition,
            'display_status' => $displayStatus,
            'display_status_label' => DepositDisplayStatus::label($displayStatus),
            'display_status_color' => DepositDisplayStatus::badgeColor($displayStatus),
        ];
    }

    /**
     * Subquery SQL tính các tổng giao dịch trên bảng transactions theo invoice_id
     */
    protected function applyAggregates(Builder $query): Builder
    {
        $threshold = self::getRefundDueThresholdDate();

        $collectedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND (t.type = 'payment' OR t.type IS NULL) AND t.deleted_at IS NULL)";
        $refundedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND t.type = 'deposit_refund' AND t.deleted_at IS NULL)";
        $deductedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND t.type = 'deposit_deduction' AND t.deleted_at IS NULL)";
        $collectionDateSub = "(SELECT MAX(t.paid_at) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND (t.type = 'payment' OR t.type IS NULL) AND t.deleted_at IS NULL)";

        $heldExpr = "CASE WHEN ({$collectedSub} - {$refundedSub} - {$deductedSub}) > 0 THEN ({$collectedSub} - {$refundedSub} - {$deductedSub}) ELSE 0 END";
        $dueExpr = "(contracts.status IN (2, 3) OR COALESCE(contract_deposits.refund_due_date, contracts.end_date) <= '{$threshold}')";

        $statusSql = "CASE
            WHEN {$collectedSub} <= 0 THEN 'unpaid'
            WHEN ({$heldExpr}) <= 0 AND {$refundedSub} > 0 THEN 'refunded'
            WHEN ({$heldExpr}) <= 0 AND {$deductedSub} > 0 THEN 'deducted'
            WHEN ({$heldExpr}) > 0 AND ({$refundedSub} + {$deductedSub}) > 0 THEN 'partial_refunded'
            WHEN ({$heldExpr}) > 0 AND {$dueExpr} THEN 'refund_due'
            WHEN {$collectedSub} > 0 AND {$collectedSub} < contract_deposits.required_amount THEN 'partial_collected'
            ELSE 'holding'
        END";

        return $query
            ->join('contracts', 'contracts.id', '=', 'contract_deposits.contract_id')
            ->whereNull('contracts.deleted_at')
            ->select('contract_deposits.*')
            ->selectRaw("contracts.status AS contract_status")
            ->selectRaw("contracts.end_date AS contract_end_date")
            ->selectRaw("{$collectedSub} AS collected_amount")
            ->selectRaw("{$refundedSub} AS refunded_amount")
            ->selectRaw("{$deductedSub} AS deducted_amount")
            ->selectRaw("{$heldExpr} AS held_amount")
            ->selectRaw("{$collectionDateSub} AS collection_date")
            ->selectRaw("{$statusSql} AS calculated_display_status");
    }

    /**
     * Áp dụng phân quyền theo vai trò người dùng
     */
    public function applyPolicyScope(Builder $query, ?User $actor = null): Builder
    {
        if (!$actor) {
            return $query;
        }

        $roleId = (int) $actor->role_id;
        if ($roleId === 2) {
            // Môi giới: chỉ thấy hợp đồng mình phụ trách
            $query->where('contracts.broker_id', $actor->id);
        } elseif (in_array($roleId, [3, 5], true)) {
            // Khách hàng: chỉ thấy hợp đồng của chính mình và không phải nháp
            $query->where('contracts.customer_id', $actor->id)
                ->where('contracts.status', '!=', 0);
        }

        return $query;
    }

    /**
     * Khởi tạo Base Query có kèm aggregates và phân quyền
     */
    public function buildBaseQuery(?User $actor = null): Builder
    {
        $query = ContractDeposit::query();
        $this->applyAggregates($query);
        $this->applyPolicyScope($query, $actor);

        return $query;
    }

    /**
     * Áp dụng bộ lọc (search, status, khoảng ngày thu, khoảng ngày hết hạn HĐ)
     */
    public function applyFilters(Builder $query, array $filters): Builder
    {
        $threshold = self::getRefundDueThresholdDate();
        $collectedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND (t.type = 'payment' OR t.type IS NULL) AND t.deleted_at IS NULL)";
        $refundedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND t.type = 'deposit_refund' AND t.deleted_at IS NULL)";
        $deductedSub = "(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND t.type = 'deposit_deduction' AND t.deleted_at IS NULL)";
        $collectionDateSub = "(SELECT MAX(t.paid_at) FROM transactions t WHERE t.invoice_id = contract_deposits.invoice_id AND t.status = " . TransactionStatus::SUCCESS . " AND (t.type = 'payment' OR t.type IS NULL) AND t.deleted_at IS NULL)";
        $heldExpr = "CASE WHEN ({$collectedSub} - {$refundedSub} - {$deductedSub}) > 0 THEN ({$collectedSub} - {$refundedSub} - {$deductedSub}) ELSE 0 END";
        $dueExpr = "(contracts.status IN (2, 3) OR COALESCE(contract_deposits.refund_due_date, contracts.end_date) <= '{$threshold}')";

        $statusSql = "CASE
            WHEN {$collectedSub} <= 0 THEN 'unpaid'
            WHEN ({$heldExpr}) <= 0 AND {$refundedSub} > 0 THEN 'refunded'
            WHEN ({$heldExpr}) <= 0 AND {$deductedSub} > 0 THEN 'deducted'
            WHEN ({$heldExpr}) > 0 AND ({$refundedSub} + {$deductedSub}) > 0 THEN 'partial_refunded'
            WHEN ({$heldExpr}) > 0 AND {$dueExpr} THEN 'refund_due'
            WHEN {$collectedSub} > 0 AND {$collectedSub} < contract_deposits.required_amount THEN 'partial_collected'
            ELSE 'holding'
        END";

        // 1. Tìm kiếm (mã/tên HĐ, tên/SĐT/email người thuê, mã/tên căn hộ)
        if (!empty($filters['search'])) {
            $term = self::escapeLike(mb_substr(trim($filters['search']), 0, 100, 'UTF-8'));
            $like = "%{$term}%";

            $query->where(function ($q) use ($like) {
                $q->where('contracts.contract_code', 'LIKE', $like)
                    ->orWhere('contracts.contract_name', 'LIKE', $like)
                    ->orWhereHas('contract.customer', function ($uq) use ($like) {
                        $uq->where('name', 'LIKE', $like)
                            ->orWhere('phone', 'LIKE', $like)
                            ->orWhere('email', 'LIKE', $like);
                    })
                    ->orWhereHas('contract.property', function ($pq) use ($like) {
                        $pq->where('code', 'LIKE', $like)
                            ->orWhere('title', 'LIKE', $like)
                            ->orWhere('address', 'LIKE', $like);
                    });
            });
        }

        // 2. Lọc trạng thái hiển thị hoặc theo thẻ thống kê
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $status = strtolower(trim($filters['status']));
            if ($status === 'collected_any') {
                // Thẻ 2 "Đã thu": collected > 0
                $query->whereRaw("{$collectedSub} > 0");
            } elseif ($status === 'held_any') {
                // Thẻ 3 "Đang giữ": held > 0
                $query->whereRaw("({$heldExpr}) > 0");
            } elseif (in_array($status, DepositDisplayStatus::all(), true)) {
                $query->whereRaw("({$statusSql}) = ?", [$status]);
            }
        }

        // 3. Lọc theo khoảng ngày thu (from_date, to_date)
        if (!empty($filters['from_date'])) {
            $from = Carbon::parse($filters['from_date'])->startOfDay()->toDateTimeString();
            $query->whereRaw("{$collectionDateSub} >= ?", [$from]);
        }
        if (!empty($filters['to_date'])) {
            $to = Carbon::parse($filters['to_date'])->endOfDay()->toDateTimeString();
            $query->whereRaw("{$collectionDateSub} <= ?", [$to]);
        }

        // 4. Lọc theo khoảng ngày hết hạn HĐ (end_from, end_to)
        if (!empty($filters['end_from'])) {
            $endFrom = Carbon::parse($filters['end_from'])->toDateString();
            $query->whereDate('contracts.end_date', '>=', $endFrom);
        }
        if (!empty($filters['end_to'])) {
            $endTo = Carbon::parse($filters['end_to'])->toDateString();
            $query->whereDate('contracts.end_date', '<=', $endTo);
        }

        // 5. Lọc theo contract_id cụ thể nếu có
        if (!empty($filters['contract_id'])) {
            $query->where('contract_deposits.contract_id', (int) $filters['contract_id']);
        }

        // 6. Sắp xếp: mặc định Cần hoàn trả lên đầu, rồi end_date tăng dần
        $sort = $filters['sort'] ?? 'refund_due_first';
        switch ($sort) {
            case 'end_date_asc':
                $query->orderBy('contracts.end_date', 'asc')->orderBy('contract_deposits.id', 'desc');
                break;
            case 'end_date_desc':
                $query->orderBy('contracts.end_date', 'desc')->orderBy('contract_deposits.id', 'desc');
                break;
            case 'amount_asc':
                $query->orderBy('contract_deposits.required_amount', 'asc')->orderBy('contract_deposits.id', 'desc');
                break;
            case 'amount_desc':
                $query->orderBy('contract_deposits.required_amount', 'desc')->orderBy('contract_deposits.id', 'desc');
                break;
            case 'collection_date_desc':
                $query->orderByRaw("{$collectionDateSub} DESC")->orderBy('contract_deposits.id', 'desc');
                break;
            case 'refund_due_first':
            default:
                $query->orderByRaw("CASE WHEN ({$statusSql}) = 'refund_due' THEN 0 ELSE 1 END ASC")
                    ->orderBy('contracts.end_date', 'asc')
                    ->orderBy('contract_deposits.id', 'desc');
                break;
        }

        return $query;
    }

    /**
     * Lấy danh sách phân trang cho màn hình Quản lý tiền cọc (Hình 44)
     */
    public function getPaginatedList(array $filters, ?User $actor = null): LengthAwarePaginator
    {
        $query = $this->buildBaseQuery($actor);

        $query->with([
            'contract.property',
            'contract.customer',
            'contract.broker',
            'invoice',
            'updater',
        ])->withCount([
            'contract as documents_count' => function ($q) {
                $q->join('contract_documents', 'contract_documents.contract_id', '=', 'contracts.id')
                    ->whereNull('contract_documents.deleted_at')
                    ->whereIn('contract_documents.document_type', [4, 6]);
            },
        ]);

        $this->applyFilters($query, $filters);

        $perPage = (int) ($filters['per_page'] ?? 10);
        if (!in_array($perPage, [10, 20, 50], true)) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        // Gắn cờ has_pending_qr và tính toán chuẩn hóa cho từng dòng
        $invoiceIds = $paginator->getCollection()->pluck('invoice_id')->filter()->values()->all();
        $pendingQrInvoiceIds = [];
        if (!empty($invoiceIds)) {
            $pendingQrInvoiceIds = DB::table('transactions')
                ->whereIn('invoice_id', $invoiceIds)
                ->where('status', TransactionStatus::PENDING)
                ->where('source', 'gateway')
                ->where('expires_at', '>', Carbon::now())
                ->whereNull('deleted_at')
                ->pluck('invoice_id')
                ->all();
        }

        $threshold = self::getRefundDueThresholdDate();
        $paginator->getCollection()->transform(function ($deposit) use ($pendingQrInvoiceIds, $threshold) {
            $metrics = self::computeMetrics($deposit, $threshold);
            foreach ($metrics as $k => $v) {
                $deposit->setAttribute($k, $v);
            }
            $deposit->setAttribute('has_pending_qr', in_array($deposit->invoice_id, $pendingQrInvoiceIds, true));
            return $deposit;
        });

        return $paginator;
    }

    /**
     * Tính 4 thẻ thống kê (Mục 3.4: theo phạm vi quyền của người xem, không phụ thuộc bộ lọc bảng)
     * Nhất quán tuyệt đối với danh sách khi bấm lọc từng thẻ!
     */
    public function getSummary(?User $actor = null): array
    {
        $rows = $this->buildBaseQuery($actor)->get();
        $threshold = self::getRefundDueThresholdDate();

        $totalHeldAmount = 0.0;
        $collectedCount = 0;
        $holdingCount = 0;
        $refundDueCount = 0;
        $refundDueAmount = 0.0;
        $unpaidCount = 0;
        $refundedCount = 0;

        foreach ($rows as $row) {
            $metrics = self::computeMetrics($row, $threshold);

            $totalHeldAmount += $metrics['held_amount'];

            if ($metrics['collected_amount'] > 0) {
                $collectedCount++;
            }

            if ($metrics['held_amount'] > 0) {
                $holdingCount++;
            }

            if ($metrics['display_status'] === DepositDisplayStatus::REFUND_DUE) {
                $refundDueCount++;
                $refundDueAmount += $metrics['held_amount'];
            }

            if ($metrics['display_status'] === DepositDisplayStatus::UNPAID) {
                $unpaidCount++;
            }

            if (in_array($metrics['display_status'], [DepositDisplayStatus::REFUNDED, DepositDisplayStatus::DEDUCTED], true)) {
                $refundedCount++;
            }
        }

        return [
            'total_held_amount' => round($totalHeldAmount, 2),
            'collected_count' => $collectedCount,
            'holding_count' => $holdingCount,
            'refund_due_count' => $refundDueCount,
            'refund_due_amount' => round($refundDueAmount, 2),
            'unpaid_count' => $unpaidCount,
            'refunded_count' => $refundedCount,
            'total_deposits' => $rows->count(),
        ];
    }

    /**
     * Lấy danh sách khoản cọc để chọn trong Modal [GHI NHẬN THANH TOÁN MỚI]
     * - mode = 'collect': các khoản cọc còn thiếu (collected < required) và HĐ chưa hủy (status != 3)
     * - mode = 'refund': các khoản cọc đang có held > 0
     */
    public function getOptions(string $mode = 'collect', ?string $search = null, ?User $actor = null, int $limit = 30): Collection
    {
        $query = $this->buildBaseQuery($actor)->with([
            'contract.property',
            'contract.customer',
            'invoice',
        ]);

        if (!empty($search)) {
            $this->applyFilters($query, ['search' => $search]);
        }

        $rows = $query->orderBy('contracts.end_date', 'asc')->limit(100)->get();
        $threshold = self::getRefundDueThresholdDate();

        $filtered = $rows->map(function ($deposit) use ($threshold) {
            $metrics = self::computeMetrics($deposit, $threshold);
            foreach ($metrics as $k => $v) {
                $deposit->setAttribute($k, $v);
            }
            return $deposit;
        })->filter(function ($deposit) use ($mode) {
            if ($mode === 'refund') {
                return (float) $deposit->held_amount > 0;
            }
            // mode === 'collect'
            $contractStatus = (int) ($deposit->contract?->status ?? 1);
            return (float) $deposit->remaining_to_collect > 0 && $contractStatus !== 3;
        })->values()->take($limit);

        return $filtered;
    }

    /**
     * Tải chi tiết 1 khoản cọc kèm đầy đủ các đại lượng dẫn xuất, sổ giao dịch và chứng từ
     */
    public function findWithMetrics(int $depositId): ContractDeposit
    {
        $deposit = ContractDeposit::query()
            ->where('contract_deposits.id', $depositId)
            ->tap(fn ($q) => $this->applyAggregates($q))
            ->with([
                'contract.property',
                'contract.customer',
                'contract.broker',
                'contract.documents' => function ($q) {
                    $q->whereNull('deleted_at')->with('uploader')->orderBy('id', 'desc');
                },
                'invoice.items',
                'invoice.transactions' => function ($q) {
                    $q->whereNull('deleted_at')->with('recorder')->orderBy('paid_at', 'desc')->orderBy('id', 'desc');
                },
                'creator',
                'updater',
            ])
            ->firstOrFail();

        $metrics = self::computeMetrics($deposit);
        foreach ($metrics as $k => $v) {
            $deposit->setAttribute($k, $v);
        }

        // Tính chính xác ngày thu đủ cọc (nếu đã thu đủ) hoặc ngày thu gần nhất
        if ($deposit->invoice && $deposit->invoice->relationLoaded('transactions')) {
            $paymentTxs = $deposit->invoice->transactions
                ->filter(fn ($tx) => (int) $tx->status === TransactionStatus::SUCCESS && in_array($tx->type, [null, '', TransactionType::PAYMENT], true))
                ->sortBy(fn ($tx) => ($tx->paid_at ? $tx->paid_at->timestamp : 0) . '-' . $tx->id);

            if ($paymentTxs->isEmpty()) {
                $deposit->setAttribute('collection_date', null);
            } else {
                $running = 0.0;
                $completedAt = null;
                $required = (float) $deposit->required_amount;
                foreach ($paymentTxs as $tx) {
                    $running = round($running + (float) $tx->amount, 2);
                    if ($running >= $required && $required > 0) {
                        $completedAt = $tx->paid_at;
                        break;
                    }
                }
                $finalDate = $completedAt ?? $paymentTxs->last()->paid_at;
                $deposit->setAttribute('collection_date', $finalDate ? Carbon::parse($finalDate)->toDateTimeString() : null);
            }
        }

        // Gắn cờ has_pending_qr
        $hasPendingQr = false;
        if ($deposit->invoice_id) {
            $hasPendingQr = DB::table('transactions')
                ->where('invoice_id', $deposit->invoice_id)
                ->where('status', TransactionStatus::PENDING)
                ->where('source', 'gateway')
                ->where('expires_at', '>', Carbon::now())
                ->whereNull('deleted_at')
                ->exists();
        }
        $deposit->setAttribute('has_pending_qr', $hasPendingQr);

        return $deposit;
    }
}

