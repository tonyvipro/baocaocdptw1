<?php

namespace App\Queries;

use App\Enums\InvoiceStatus;
use App\Enums\TransactionStatus;
use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DebtQuery
{
    /**
     * Biểu thức SQL tính display_status dùng chung cho mọi loại hóa đơn
     */
    public static function getDisplayStatusSql(string $table = 'invoices'): string
    {
        $today = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();
        return "CASE 
            WHEN {$table}.status = 3 THEN 'cancelled'
            WHEN (COALESCE({$table}.paid_amount, 0) >= {$table}.amount AND {$table}.amount > 0) THEN 'paid'
            WHEN ({$table}.due_date IS NOT NULL AND {$table}.due_date < '{$today}') THEN 'overdue'
            WHEN (COALESCE({$table}.paid_amount, 0) > 0 AND ({$table}.due_date IS NULL OR {$table}.due_date >= '{$today}')) THEN 'partial'
            ELSE 'unpaid'
        END";
    }

    /**
     * Biểu thức SQL tính tháng của hóa đơn
     */
    public static function getInvoiceMonthSql(string $table = 'invoices'): string
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            return "COALESCE(strftime('%Y-%m', {$table}.billing_period_start), strftime('%Y-%m', {$table}.issue_date), strftime('%Y-%m', {$table}.due_date))";
        }
        return "COALESCE(DATE_FORMAT({$table}.billing_period_start, '%Y-%m'), DATE_FORMAT({$table}.issue_date, '%Y-%m'), DATE_FORMAT({$table}.due_date, '%Y-%m'))";
    }

    /**
     * Lấy danh sách công nợ có tìm kiếm, lọc, phân quyền và phân trang (Mục 3.1)
     */
    public function getDebts(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = $this->buildBaseQuery($user, $filters);

        // Phân trang: giới hạn whitelist 10, 20, 50
        $perPage = (int) ($filters['per_page'] ?? 10);
        if (!in_array($perPage, [10, 20, 50], true)) {
            $perPage = 10;
        }

        $paginator = $query->paginate($perPage);

        // Gắn cờ có giao dịch QR đang chờ (has_pending_qr) cho từng hóa đơn
        $invoiceIds = $paginator->getCollection()->pluck('id')->toArray();
        $pendingQrInvoiceIds = [];
        if (!empty($invoiceIds)) {
            $pendingQrInvoiceIds = DB::table('transactions')
                ->whereIn('invoice_id', $invoiceIds)
                ->where('status', TransactionStatus::PENDING)
                ->where('source', 'gateway')
                ->where('expires_at', '>', Carbon::now())
                ->pluck('invoice_id')
                ->toArray();
        }

        $paginator->getCollection()->transform(function ($invoice) use ($pendingQrInvoiceIds) {
            $invoice->has_pending_qr = in_array($invoice->id, $pendingQrInvoiceIds, true);
            $total = (float) $invoice->amount;
            $paid = (float) $invoice->paid_amount;
            $invoice->remaining_amount = max(0.0, round($total - $paid, 2));
            return $invoice;
        });

        return $paginator;
    }

    /**
     * Lấy số liệu 4 thẻ thống kê theo tháng được chọn (Mục 3.1)
     */
    public function getSummary(User $user, ?string $month = null): array
    {
        $selectedMonth = $month ?: Carbon::today('Asia/Ho_Chi_Minh')->format('Y-m');
        $startOfMonth = Carbon::parse($selectedMonth . '-01')->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // 1. Thẻ 1: Tổng thu tháng này (tổng giao dịch THÀNH CÔNG có paid_at trong tháng)
        $txQuery = DB::table('transactions')
            ->join('invoices', 'invoices.id', '=', 'transactions.invoice_id')
            ->join('contracts', 'contracts.id', '=', 'invoices.contract_id')
            ->where('transactions.status', TransactionStatus::SUCCESS)
            ->whereBetween('transactions.paid_at', [$startOfMonth, $endOfMonth])
            ->whereNull('transactions.deleted_at');

        if ((int) $user->role_id === 2) { // Môi giới
            $txQuery->where('contracts.broker_id', $user->id);
        } elseif ((int) $user->role_id === 3) { // Khách hàng
            $txQuery->where('contracts.customer_id', $user->id);
        }

        $totalCollected = (float) $txQuery->sum('transactions.amount');

        // Lấy toàn bộ hóa đơn thuộc tháng đang chọn (kỳ hạn hoặc ngày lập rơi vào tháng)
        $monthSql = self::getInvoiceMonthSql('invoices');
        $invQuery = Invoice::query()
            ->join('contracts', 'contracts.id', '=', 'invoices.contract_id')
            ->whereRaw("{$monthSql} = ?", [$selectedMonth])
            ->where('invoices.status', '!=', InvoiceStatus::CANCELLED);

        if ((int) $user->role_id === 2) {
            $invQuery->where('contracts.broker_id', $user->id);
        } elseif ((int) $user->role_id === 3) {
            $invQuery->where('contracts.customer_id', $user->id);
        }

        $invoices = $invQuery->select([
            'invoices.id',
            'invoices.amount',
            'invoices.paid_amount',
            'invoices.due_date',
            'invoices.status',
        ])->get();

        $today = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();

        $paidAmountTotal = 0.0;
        $remainingAmountTotal = 0.0;
        $overdueCount = 0;
        $overdueAmountTotal = 0.0;

        foreach ($invoices as $inv) {
            $amount = (float) $inv->amount;
            $paid = (float) $inv->paid_amount;
            $remaining = max(0.0, round($amount - $paid, 2));

            $paidAmountTotal += min($paid, $amount);
            $remainingAmountTotal += $remaining;

            // Kiểm tra quá hạn
            $isOverdue = ($remaining > 0 && $inv->due_date && Carbon::parse($inv->due_date)->toDateString() < $today);
            if ($isOverdue) {
                $overdueCount++;
                $overdueAmountTotal += $remaining;
            }
        }

        return [
            'month' => $selectedMonth,
            'total_collected' => round($totalCollected, 2),
            'paid_amount' => round($paidAmountTotal, 2),
            'remaining_amount' => round($remainingAmountTotal, 2),
            'overdue_count' => $overdueCount,
            'overdue_amount' => round($overdueAmountTotal, 2),
        ];
    }

    /**
     * Xây dựng câu truy vấn cơ sở
     */
    protected function buildBaseQuery(User $user, array $filters): Builder
    {
        $statusSql = self::getDisplayStatusSql('invoices');
        $monthSql = self::getInvoiceMonthSql('invoices');

        $query = Invoice::query()
            ->with([
                'contract.property',
                'contract.customer',
                'contract.broker',
                'items',
            ])
            ->select('invoices.*')
            ->selectRaw("{$statusSql} AS calculated_display_status")
            ->selectRaw("{$monthSql} AS calculated_invoice_month");

        // 1. Phân quyền dữ liệu (Policy Scope)
        if ((int) $user->role_id === 2) { // Môi giới
            $query->whereHas('contract', fn ($q) => $q->where('broker_id', $user->id));
        } elseif ((int) $user->role_id === 3) { // Khách hàng
            $query->whereHas('contract', fn ($q) => $q->where('customer_id', $user->id));
        }

        // 2. Tìm kiếm (Hợp đồng, Người thuê, Căn hộ/BĐS, Số hóa đơn - tối đa 100 ký tự)
        if (!empty($filters['search'])) {
            $search = mb_substr(trim($filters['search']), 0, 100, 'UTF-8');
            $query->where(function ($q) use ($search) {
                $q->where('invoices.invoice_no', 'LIKE', "%{$search}%")
                    ->orWhereHas('contract', function ($cq) use ($search) {
                        $cq->where('contract_code', 'LIKE', "%{$search}%")
                            ->orWhere('contract_name', 'LIKE', "%{$search}%")
                            ->orWhereHas('customer', fn ($uq) => $uq->where('name', 'LIKE', "%{$search}%")->orWhere('phone', 'LIKE', "%{$search}%"))
                            ->orWhereHas('property', fn ($pq) => $pq->where('title', 'LIKE', "%{$search}%")->orWhere('code', 'LIKE', "%{$search}%")->orWhere('address', 'LIKE', "%{$search}%"));
                    });
            });
        }

        // 3. Lọc theo tháng (YYYY-MM)
        if (!empty($filters['month'])) {
            $month = trim($filters['month']);
            $query->whereRaw("{$monthSql} = ?", [$month]);
        }

        // 4. Lọc theo loại khoản thu (type: rent, deposit, service, sale, other)
        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('invoices.type', $filters['type']);
        }

        // 5. Lọc theo trạng thái hiển thị
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $statusFilter = strtolower($filters['status']);
            $today = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();

            switch ($statusFilter) {
                case 'paid':
                    $query->where('invoices.status', '!=', InvoiceStatus::CANCELLED)
                        ->whereRaw('COALESCE(invoices.paid_amount, 0) >= invoices.amount AND invoices.amount > 0');
                    break;
                case 'overdue':
                    $query->where('invoices.status', '!=', InvoiceStatus::CANCELLED)
                        ->whereRaw('COALESCE(invoices.paid_amount, 0) < invoices.amount')
                        ->whereNotNull('invoices.due_date')
                        ->whereDate('invoices.due_date', '<', $today);
                    break;
                case 'partial':
                    $query->where('invoices.status', '!=', InvoiceStatus::CANCELLED)
                        ->whereRaw('COALESCE(invoices.paid_amount, 0) > 0')
                        ->whereRaw('COALESCE(invoices.paid_amount, 0) < invoices.amount')
                        ->where(function ($q) use ($today) {
                            $q->whereNull('invoices.due_date')
                                ->orWhereDate('invoices.due_date', '>=', $today);
                        });
                    break;
                case 'upcoming':
                case 'unpaid':
                    $query->where('invoices.status', '!=', InvoiceStatus::CANCELLED)
                        ->whereRaw('COALESCE(invoices.paid_amount, 0) = 0')
                        ->where(function ($q) use ($today) {
                            $q->whereNull('invoices.due_date')
                                ->orWhereDate('invoices.due_date', '>=', $today);
                        });
                    break;
                case 'cancelled':
                    $query->where('invoices.status', InvoiceStatus::CANCELLED);
                    break;
            }
        }

        // 6. Sắp xếp mặc định: Quá hạn lên đầu, sau đó theo due_date tăng dần
        $query->orderByRaw("CASE 
            WHEN {$statusSql} = 'overdue' THEN 1 
            WHEN {$statusSql} = 'partial' THEN 2 
            WHEN {$statusSql} = 'unpaid' THEN 3 
            WHEN {$statusSql} = 'paid' THEN 4 
            ELSE 5 
        END ASC")
        ->orderBy('invoices.due_date', 'asc')
        ->orderBy('invoices.id', 'desc');

        return $query;
    }
}
