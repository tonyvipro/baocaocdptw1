<?php

namespace App\Queries;

use App\Models\Invoice;
use App\Models\User;
use App\Enums\InvoiceType;
use App\Enums\TransactionStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class RentPaymentQuery
{
    /**
     * Biểu thức SQL tính display_status (Mục 3.3)
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
     * Biểu thức SQL tính tháng của hóa đơn rent (Mục 3.4)
     * Tháng của hóa đơn = tháng của billing_period_start; nếu NULL thì tháng của issue_date.
     * Tương thích cả MySQL (DATE_FORMAT) và SQLite (strftime).
     */
    public static function getRentMonthSql(string $table = 'invoices'): string
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            return "COALESCE(strftime('%Y-%m', {$table}.billing_period_start), strftime('%Y-%m', {$table}.issue_date))";
        }
        return "COALESCE(DATE_FORMAT({$table}.billing_period_start, '%Y-%m'), DATE_FORMAT({$table}.issue_date, '%Y-%m'))";
    }

    /**
     * Tính display_status trong PHP cho một model Invoice
     */
    public static function computeDisplayStatus(Invoice $invoice): string
    {
        if ((int) $invoice->status === 3) {
            return 'cancelled';
        }

        $amount = (float) $invoice->amount;
        $paid = (float) $invoice->paid_amount;
        $today = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();
        $dueDate = $invoice->due_date ? Carbon::parse($invoice->due_date)->toDateString() : null;

        if ($paid >= $amount && $amount > 0) {
            return 'paid';
        }

        if ($dueDate && $dueDate < $today) {
            return 'overdue';
        }

        if ($paid > 0 && (!$dueDate || $dueDate >= $today)) {
            return 'partial';
        }

        return 'unpaid';
    }

    /**
     * Escape ký tự đặc biệt trong LIKE search (Mục 3.5 & 3.11)
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /**
     * Khởi tạo Query cơ sở cho hóa đơn tiền thuê
     */
    public function buildBaseQuery(?User $actor = null): Builder
    {
        $statusSql = self::getDisplayStatusSql('invoices');
        $monthSql = self::getRentMonthSql('invoices');

        $query = Invoice::query()
            ->where('invoices.type', InvoiceType::RENT)
            ->select('invoices.*')
            ->selectRaw("{$statusSql} AS calculated_display_status")
            ->selectRaw("{$monthSql} AS rent_month");

        // Phân quyền (Mục 3.10)
        if ($actor) {
            if ($actor->role_id === 2) { // Môi giới
                $query->whereHas('contract', function ($q) use ($actor) {
                    $q->where('broker_id', $actor->id);
                });
            } elseif ($actor->role_id === 5) { // Khách hàng bị chặn hoàn toàn
                $query->whereRaw('1 = 0');
            }
        }

        return $query;
    }

    /**
     * Lấy danh sách phân trang theo bộ lọc (Mục 3.5)
     */
    public function getPaginatedList(array $filters, ?User $actor = null): LengthAwarePaginator
    {
        $query = $this->buildBaseQuery($actor);

        // Eager load tránh N+1
        $query->with([
            'contract.property',
            'contract.customer',
            'contract.broker',
            'updater',
        ]);

        // Lọc tháng (Mục 3.5: mặc định tháng hiện tại, hoặc 'all')
        $month = $filters['month'] ?? Carbon::now('Asia/Ho_Chi_Minh')->format('Y-m');
        if ($month !== 'all') {
            $monthSql = self::getRentMonthSql('invoices');
            $query->whereRaw("{$monthSql} = ?", [$month]);
        }

        // Lọc trạng thái (paid, partial, overdue, unpaid, upcoming, cancelled)
        $status = $filters['status'] ?? null;
        if ($status === 'upcoming') {
            $statusSql = self::getDisplayStatusSql('invoices');
            $query->whereRaw("({$statusSql}) IN ('unpaid', 'partial')");
        } elseif ($status && in_array($status, ['paid', 'partial', 'overdue', 'unpaid', 'cancelled'])) {
            $statusSql = self::getDisplayStatusSql('invoices');
            $query->whereRaw("({$statusSql}) = ?", [$status]);
        } else {
            // Mặc định không hiện hóa đơn đã hủy (status = 3) trừ khi được lọc rõ
            $query->where('invoices.status', '!=', 3);
        }

        // Tìm kiếm (Mục 3.5: hợp đồng, người thuê, căn hộ, số hóa đơn)
        if (!empty($filters['search'])) {
            $term = self::escapeLike(trim($filters['search']));
            $like = "%{$term}%";

            $query->where(function ($q) use ($like) {
                $q->where('invoices.invoice_no', 'LIKE', $like)
                    ->orWhereHas('contract', function ($cq) use ($like) {
                        $cq->where('contract_code', 'LIKE', $like)
                            ->orWhere('contract_name', 'LIKE', $like)
                            ->orWhereHas('customer', function ($userQ) use ($like) {
                                $userQ->where('name', 'LIKE', $like)
                                    ->orWhere('phone', 'LIKE', $like)
                                    ->orWhere('email', 'LIKE', $like);
                            })
                            ->orWhereHas('property', function ($propQ) use ($like) {
                                $propQ->where('code', 'LIKE', $like)
                                    ->orWhere('title', 'LIKE', $like)
                                    ->orWhere('address', 'LIKE', $like);
                            });
                    });
            });
        }

        // Sắp xếp
        $sort = $filters['sort'] ?? 'overdue_first';
        $today = Carbon::today('Asia/Ho_Chi_Minh')->toDateString();

        switch ($sort) {
            case 'due_date_asc':
                $query->orderBy('invoices.due_date', 'asc');
                break;
            case 'due_date_desc':
                $query->orderBy('invoices.due_date', 'desc');
                break;
            case 'amount_asc':
                $query->orderBy('invoices.amount', 'asc');
                break;
            case 'amount_desc':
                $query->orderBy('invoices.amount', 'desc');
                break;
            case 'overdue_first':
            default:
                // Quá hạn lên đầu (due_date < hôm nay và chưa trả đủ), sau đó due_date tăng dần
                $query->orderByRaw("CASE WHEN invoices.due_date < '{$today}' AND COALESCE(invoices.paid_amount, 0) < invoices.amount THEN 0 ELSE 1 END")
                    ->orderBy('invoices.due_date', 'asc')
                    ->orderBy('invoices.id', 'desc');
                break;
        }

        $perPage = (int) ($filters['per_page'] ?? 10);
        if (!in_array($perPage, [10, 20, 50])) {
            $perPage = 10;
        }

        return $query->paginate($perPage);
    }

    /**
     * Thẻ thống kê theo tháng đang chọn (Mục 3.4)
     */
    public function getSummary(string $month, ?User $actor = null): array
    {
        $statusSql = self::getDisplayStatusSql('invoices');
        $monthSql = self::getRentMonthSql('invoices');

        // 1. Tổng thu tháng này: tổng transactions.amount THÀNH CÔNG (type = payment) có paid_at nằm trong tháng, thuộc hóa đơn rent chưa hủy
        $txQuery = DB::table('transactions')
            ->join('invoices', 'transactions.invoice_id', '=', 'invoices.id')
            ->join('contracts', 'invoices.contract_id', '=', 'contracts.id')
            ->where('invoices.type', InvoiceType::RENT)
            ->where('invoices.status', '!=', 3)
            ->whereNull('invoices.deleted_at')
            ->whereNull('transactions.deleted_at')
            ->where('transactions.status', TransactionStatus::SUCCESS)
            ->where(function ($q) {
                $q->where('transactions.type', 'payment')->orWhereNull('transactions.type');
            });

        // Phân quyền môi giới
        if ($actor && $actor->role_id === 2) {
            $txQuery->where('contracts.broker_id', $actor->id);
        } elseif ($actor && $actor->role_id === 5) {
            $txQuery->whereRaw('1 = 0');
        }

        if ($month !== 'all') {
            $startOfMonth = Carbon::parse($month . '-01')->startOfMonth()->toDateTimeString();
            $endOfMonth = Carbon::parse($month . '-01')->endOfMonth()->toDateTimeString();
            $txQuery->whereBetween('transactions.paid_at', [$startOfMonth, $endOfMonth]);
        }

        $totalCollected = (float) $txQuery->sum('transactions.amount');

        // 2. Thống kê hóa đơn theo tháng (căn hộ, còn nợ, số lượng căn theo trạng thái)
        $invQuery = DB::table('invoices')
            ->join('contracts', 'invoices.contract_id', '=', 'contracts.id')
            ->where('invoices.type', InvoiceType::RENT)
            ->where('invoices.status', '!=', 3)
            ->whereNull('invoices.deleted_at');

        if ($actor && $actor->role_id === 2) {
            $invQuery->where('contracts.broker_id', $actor->id);
        } elseif ($actor && $actor->role_id === 5) {
            $invQuery->whereRaw('1 = 0');
        }

        if ($month !== 'all') {
            $invQuery->whereRaw("{$monthSql} = ?", [$month]);
        }

        // Lấy danh sách các dòng kèm property_id và calculated display_status
        $rows = $invQuery->select([
            'contracts.property_id',
            'invoices.amount',
            'invoices.paid_amount',
            DB::raw("{$statusSql} AS display_status"),
        ])->get();

        $totalOutstanding = 0.0;
        $paidCount = 0;
        $overdueCount = 0;
        $upcomingCount = 0;
        $partialCount = 0;

        foreach ($rows as $row) {
            $amt = (float) $row->amount;
            $paid = (float) $row->paid_amount;
            $rem = max(0.0, round($amt - $paid, 2));
            $totalOutstanding += $rem;

            switch ($row->display_status) {
                case 'paid':
                    $paidCount++;
                    break;
                case 'overdue':
                    $overdueCount++;
                    break;
                case 'partial':
                    $partialCount++;
                    // Trả một phần gộp vào Chưa đến hạn nếu chưa quá hạn (Mục 3.4 & Giả định 1)
                    $upcomingCount++;
                    break;
                case 'unpaid':
                default:
                    $upcomingCount++;
                    break;
            }
        }

        return [
            'month' => $month,
            'total_collected' => round($totalCollected, 2),
            'total_outstanding' => round($totalOutstanding, 2),
            'paid_units' => $paidCount,
            'overdue_units' => $overdueCount,
            'upcoming_units' => $upcomingCount,
            'partial_units' => $partialCount,
        ];
    }

    /**
     * Danh sách hóa đơn tiền thuê còn nợ để chọn trong modal ghi nhận (Mục 5.1)
     */
    public function getPayableInvoices(?string $search = null, ?User $actor = null, int $limit = 20)
    {
        $statusSql = self::getDisplayStatusSql('invoices');

        $query = Invoice::query()
            ->where('invoices.type', InvoiceType::RENT)
            ->where('invoices.status', '!=', 3) // Chưa hủy
            ->whereRaw('(invoices.amount - COALESCE(invoices.paid_amount, 0)) > 0') // Còn nợ > 0
            ->with(['contract.property', 'contract.customer', 'updater'])
            ->select('invoices.*')
            ->selectRaw("{$statusSql} AS calculated_display_status");

        if ($actor) {
            if ($actor->role_id === 2) {
                $query->whereHas('contract', function ($q) use ($actor) {
                    $q->where('broker_id', $actor->id);
                });
            } elseif ($actor->role_id === 5) {
                $query->whereRaw('1 = 0');
            }
        }

        if (!empty($search)) {
            $term = self::escapeLike(trim($search));
            $like = "%{$term}%";
            $query->where(function ($q) use ($like) {
                $q->where('invoices.invoice_no', 'LIKE', $like)
                    ->orWhereHas('contract', function ($cq) use ($like) {
                        $cq->where('contract_code', 'LIKE', $like)
                            ->orWhereHas('customer', function ($uq) use ($like) {
                                $uq->where('name', 'LIKE', $like)
                                    ->orWhere('phone', 'LIKE', $like);
                            })
                            ->orWhereHas('property', function ($pq) use ($like) {
                                $pq->where('code', 'LIKE', $like)
                                    ->orWhere('title', 'LIKE', $like);
                            });
                    });
            });
        }

        return $query->orderBy('invoices.due_date', 'asc')
            ->limit($limit)
            ->get();
    }
}
