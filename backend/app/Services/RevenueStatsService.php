<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RevenueStatsService
{
    public const TIMEZONE = 'Asia/Ho_Chi_Minh';

    /**
     * Tạo một đối tượng Carbon với Timezone chuẩn của hệ thống
     */
    public function now(?Carbon $ref = null): Carbon
    {
        return $ref ? $ref->copy()->setTimezone(self::TIMEZONE) : Carbon::now(self::TIMEZONE);
    }

    /**
     * Lấy khoảng thời gian của một tháng theo khoảng nửa mở: [startOfMonth, startOfNextMonth)
     *
     * @param Carbon|null $ref Thời điểm tham chiếu (mặc định là thời điểm hiện tại)
     * @return array [Carbon $startOfMonth, Carbon $startOfNextMonth]
     */
    public function getMonthRange(?Carbon $ref = null): array
    {
        $current = $this->now($ref);
        $startOfMonth = $current->copy()->startOfMonth();
        $startOfNextMonth = $startOfMonth->copy()->addMonth();

        return [$startOfMonth, $startOfNextMonth];
    }

    /**
     * Lấy khoảng thời gian của tháng trước liền kề: [startOfPrevMonth, startOfMonth)
     *
     * @param Carbon|null $ref Thời điểm tham chiếu (mặc định là thời điểm hiện tại)
     * @return array [Carbon $startOfPrevMonth, Carbon $startOfMonth]
     */
    public function getPreviousMonthRange(?Carbon $ref = null): array
    {
        $current = $this->now($ref);
        $startOfMonth = $current->copy()->startOfMonth();
        $startOfPrevMonth = $startOfMonth->copy()->subMonth();

        return [$startOfPrevMonth, $startOfMonth];
    }

    /**
     * Xác định khoảng thời gian nửa mở [start, end) dựa trên kỳ báo cáo theo timezone Asia/Ho_Chi_Minh
     *
     * @param string $period 'today'|'this_week'|'this_month'|'this_quarter'|'this_year'|'custom'
     * @param string|null $startParam
     * @param string|null $endParam
     * @param Carbon|null $ref
     * @return array [Carbon $start, Carbon $end] quy ước nửa mở [start, end)
     */
    public function resolvePeriodRange(string $period = 'this_month', ?string $startParam = null, ?string $endParam = null, ?Carbon $ref = null): array
    {
        $now = $this->now($ref);

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $start->copy()->addDay();
                return [$start, $end];

            case 'this_week':
                $start = $now->copy()->startOfWeek();
                $end = $start->copy()->addWeek();
                return [$start, $end];

            case 'this_quarter':
                $start = $now->copy()->firstOfQuarter()->startOfDay();
                $end = $start->copy()->addMonths(3);
                return [$start, $end];

            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end = $start->copy()->addYear();
                return [$start, $end];

            case 'custom':
                if ($startParam && $endParam) {
                    $start = Carbon::parse($startParam, self::TIMEZONE)->startOfDay();
                    $end = Carbon::parse($endParam, self::TIMEZONE)->addDay()->startOfDay();
                    if ($end->lessThanOrEqualTo($start)) {
                        $end = $start->copy()->addDay();
                    }
                    return [$start, $end];
                }
                return $this->getMonthRange($ref);

            case 'this_month':
            default:
                return $this->getMonthRange($ref);
        }
    }

    /**
     * Xác định khoảng thời gian nửa mở [prevStart, prevEnd) liền kề trước đó để so sánh % tăng/giảm
     *
     * @param string $period
     * @param Carbon $start
     * @param Carbon $end
     * @param Carbon|null $ref
     * @return array [Carbon $prevStart, Carbon $prevEnd]
     */
    public function getPreviousPeriodRange(string $period, Carbon $start, Carbon $end, ?Carbon $ref = null): array
    {
        switch ($period) {
            case 'this_month':
                return $this->getPreviousMonthRange($ref ?: $start);

            case 'today':
                return [$start->copy()->subDay(), $start->copy()];

            case 'this_week':
                return [$start->copy()->subWeek(), $start->copy()];

            case 'this_quarter':
                return [$start->copy()->subMonths(3), $start->copy()];

            case 'this_year':
                return [$start->copy()->subYear(), $start->copy()];

            case 'custom':
            default:
                $diffSeconds = max(1, $end->diffInSeconds($start));
                return [$start->copy()->subSeconds($diffSeconds), $start->copy()];
        }
    }

    /**
     * Tính tổng doanh thu thực thu trong khoảng nửa mở [$start, $end)
     *
     * Doanh thu thực thu dựa trên ngày thu tiền thực tế (paid_at), bao gồm:
     * 1. Số tiền từ các giao dịch thanh toán thành công (transactions.status = 1) có paid_at trong kỳ.
     * 2. Số tiền từ các hóa đơn đã thanh toán (invoices) có paid_at trong kỳ mà chưa có bản ghi transactions (fallback bảo vệ kép).
     *
     * @param Carbon|string $start
     * @param Carbon|string $end
     * @return float
     */
    public function getRevenueBetween($start, $end): float
    {
        $startCarbon = ($start instanceof Carbon ? $start->copy() : Carbon::parse($start))->setTimezone(self::TIMEZONE);
        $endCarbon = ($end instanceof Carbon ? $end->copy() : Carbon::parse($end))->setTimezone(self::TIMEZONE);

        $startStr = $startCarbon->format('Y-m-d H:i:s');
        $endStr = $endCarbon->format('Y-m-d H:i:s');

        $transactionRevenue = 0.0;
        $directInvoiceRevenue = 0.0;

        // 1. Thu từ bảng transactions (các đợt thanh toán thực tế bao gồm thanh toán 1 phần hoặc đủ)
        if (Schema::hasTable('transactions')) {
            $txQuery = DB::table('transactions')
                ->where('status', 1)
                ->whereNotNull('paid_at')
                ->where('paid_at', '>=', $startStr)
                ->where('paid_at', '<', $endStr);

            if (Schema::hasColumn('transactions', 'deleted_at')) {
                $txQuery->whereNull('deleted_at');
            }

            $transactionRevenue = (float) $txQuery->sum('amount');
        }

        // 2. Thu từ bảng invoices mà CHƯA có bản ghi transaction thành công nào (tránh double count và hỗ trợ invoice legacy / unit test)
        if (Schema::hasTable('invoices')) {
            $invQuery = DB::table('invoices')
                ->where('status', '!=', 3) // Không tính hóa đơn đã hủy
                ->whereNotNull('paid_at')
                ->where('paid_at', '>=', $startStr)
                ->where('paid_at', '<', $endStr);

            if (Schema::hasColumn('invoices', 'deleted_at')) {
                $invQuery->whereNull('deleted_at');
            }

            // Loại trừ những invoice đã có ít nhất 1 transaction thành công (để không bị tính trùng)
            if (Schema::hasTable('transactions')) {
                $invQuery->whereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('transactions')
                        ->whereColumn('transactions.invoice_id', 'invoices.id')
                        ->where('transactions.status', 1);

                    if (Schema::hasColumn('transactions', 'deleted_at')) {
                        $sub->whereNull('transactions.deleted_at');
                    }
                });
            }

            // Lấy số tiền thực thu: ưu tiên paid_amount nếu > 0, ngược lại lấy amount
            $directInvoiceRevenue = (float) $invQuery->sum(DB::raw('COALESCE(NULLIF(paid_amount, 0), amount)'));
        }

        return round($transactionRevenue + $directInvoiceRevenue, 2);
    }

    /**
     * Doanh thu thực thu tháng hiện tại
     */
    public function getCurrentMonthRevenue(?Carbon $ref = null): float
    {
        [$start, $end] = $this->getMonthRange($ref);
        return $this->getRevenueBetween($start, $end);
    }

    /**
     * Doanh thu thực thu tháng trước
     */
    public function getPreviousMonthRevenue(?Carbon $ref = null): float
    {
        [$start, $end] = $this->getPreviousMonthRange($ref);
        return $this->getRevenueBetween($start, $end);
    }

    /**
     * Tỷ lệ tăng trưởng doanh thu so với tháng trước (%)
     */
    public function getMonthGrowthRate(?Carbon $ref = null): float
    {
        $current = $this->getCurrentMonthRevenue($ref);
        $prev = $this->getPreviousMonthRevenue($ref);

        return $this->calculatePercentageChange($current, $prev);
    }

    /**
     * Tính % tăng/giảm an toàn
     */
    public function calculatePercentageChange(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * Lấy chuỗi dữ liệu Sparkline cho N tháng gần nhất
     *
     * @param int $months Số tháng (mặc định 6)
     * @param Carbon|null $ref Thời điểm mốc
     * @return array ['labels' => string[], 'data' => float[]]
     */
    public function getMonthlySparkline(int $months = 6, ?Carbon $ref = null): array
    {
        $now = $this->now($ref);
        $labels = [];
        $data = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $monthRef = $now->copy()->subMonths($i);
            $labels[] = 'T' . $monthRef->format('m');
            [$start, $end] = $this->getMonthRange($monthRef);
            $data[] = $this->getRevenueBetween($start, $end);
        }

        return [
            'labels' => $labels,
            'data' => $data,
        ];
    }

    /**
     * Lấy danh sách giao dịch thu tiền gần nhất phục vụ Dashboard Recent Activities
     *
     * @param int $limit
     * @return array
     */
    public function getRecentPayments(int $limit = 5): array
    {
        $activities = [];

        // Lấy từ bảng transactions nếu có
        if (Schema::hasTable('transactions')) {
            $txQuery = DB::table('transactions')
                ->leftJoin('invoices', 'transactions.invoice_id', '=', 'invoices.id')
                ->leftJoin('contracts', 'invoices.contract_id', '=', 'contracts.id')
                ->leftJoin('users', 'contracts.customer_id', '=', 'users.id')
                ->select(
                    'transactions.id',
                    'transactions.amount',
                    'transactions.paid_at',
                    'transactions.transaction_code',
                    'invoices.title as invoice_title',
                    'users.name as customer_name'
                )
                ->where('transactions.status', 1)
                ->whereNotNull('transactions.paid_at')
                ->orderByDesc('transactions.paid_at')
                ->limit($limit);

            if (Schema::hasColumn('transactions', 'deleted_at')) {
                $txQuery->whereNull('transactions.deleted_at');
            }

            $txs = $txQuery->get();

            foreach ($txs as $tx) {
                $payer = $tx->customer_name ?: 'Khách hàng';
                $title = $tx->invoice_title ?: ($tx->transaction_code ?: 'Giao dịch thanh toán');
                $paidAtCarbon = Carbon::parse($tx->paid_at, self::TIMEZONE);

                $activities[] = [
                    'type' => 'PAYMENT',
                    'badge' => 'Thanh toán nhận',
                    'badge_color' => 'emerald',
                    'content' => 'Thanh toán nhận: ' . $payer . ' - ' . $title,
                    'detail' => number_format((float) $tx->amount, 0, ',', '.') . ' VNĐ',
                    'created_at' => $tx->paid_at,
                    'time_formatted' => $paidAtCarbon->format('d/m/Y H:i'),
                ];
            }
        }

        // Nếu chưa có transactions nào (database rỗng transactions), fallback sang invoices
        if (empty($activities) && Schema::hasTable('invoices')) {
            $invs = DB::table('invoices')
                ->leftJoin('contracts', 'invoices.contract_id', '=', 'contracts.id')
                ->leftJoin('users', 'contracts.customer_id', '=', 'users.id')
                ->select(
                    'invoices.id',
                    'invoices.title',
                    'invoices.amount',
                    'invoices.paid_amount',
                    'invoices.paid_at',
                    'invoices.created_at',
                    'users.name as customer_name'
                )
                ->where('invoices.status', 1)
                ->whereNotNull('invoices.paid_at')
                ->orderByDesc('invoices.paid_at')
                ->limit($limit)
                ->get();

            foreach ($invs as $inv) {
                $payer = $inv->customer_name ?: 'Khách hàng';
                $amount = (float) ($inv->paid_amount > 0 ? $inv->paid_amount : $inv->amount);
                $paidAtCarbon = Carbon::parse($inv->paid_at, self::TIMEZONE);

                $activities[] = [
                    'type' => 'PAYMENT',
                    'badge' => 'Thanh toán nhận',
                    'badge_color' => 'emerald',
                    'content' => 'Thanh toán nhận: ' . $payer . ' - ' . $inv->title,
                    'detail' => number_format($amount, 0, ',', '.') . ' VNĐ',
                    'created_at' => $inv->paid_at,
                    'time_formatted' => $paidAtCarbon->format('d/m/Y H:i'),
                ];
            }
        }

        return $activities;
    }
}

