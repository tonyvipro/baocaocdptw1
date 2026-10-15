<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Lấy dữ liệu báo cáo thống kê theo loại và khoảng thời gian thực từ Database
     */
    public function getStatistics(Request $request)
    {
        $reportType = $request->query('report_type', 'overview');
        $reportPeriod = $request->query('report_period', 'this_month');
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        // Xác định khoảng thời gian lọc (Start Date & End Date)
        [$start, $end] = $this->resolveDateRange($reportPeriod, $startDateParam, $endDateParam);

        $cacheKey = "report_stat_{$reportType}_{$reportPeriod}_" . $start->format('Ymd') . '_' . $end->format('Ymd');

        $result = Cache::remember($cacheKey, 20, function () use ($reportType, $reportPeriod, $start, $end) {
            // Tính toán khoảng thời gian liền kề trước đó để so sánh % tăng/giảm thực tế
            $diffDays = $start->diffInDays($end) + 1;
            $prevEnd = $start->copy()->subSecond();
            $prevStart = $prevEnd->copy()->subDays($diffDays - 1)->startOfDay();

            // 1. Thẻ KPI: Doanh thu thực tế (Từ bảng invoices đã thanh toán status = 1)
            $currentRevenue = (float) DB::table('invoices')
                ->where('status', 1)
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount');

            $prevRevenue = (float) DB::table('invoices')
                ->where('status', 1)
                ->whereBetween('created_at', [$prevStart, $prevEnd])
                ->sum('amount');

            $revenueChange = $this->calculatePercentageChange($currentRevenue, $prevRevenue);

            // 2. Thẻ KPI: Tỷ lệ lấp đầy
            $totalProperties = DB::table('properties')->whereNull('deleted_at')->count();
            $rentedProperties = DB::table('contracts')
                ->where('status', 1)
                ->where('start_date', '<=', $end->toDateString())
                ->where('end_date', '>=', $start->toDateString())
                ->distinct('property_id')
                ->count('property_id');

            $occupancyRate = $totalProperties > 0 ? round(($rentedProperties / $totalProperties) * 100, 1) : 0;

            $prevRentedProperties = DB::table('contracts')
                ->where('status', 1)
                ->where('start_date', '<=', $prevEnd->toDateString())
                ->where('end_date', '>=', $prevStart->toDateString())
                ->distinct('property_id')
                ->count('property_id');
            $prevOccupancyRate = $totalProperties > 0 ? round(($prevRentedProperties / $totalProperties) * 100, 1) : 0;
            $occupancyChange = round($occupancyRate - $prevOccupancyRate, 1);

            // 3. Thẻ KPI: Yêu cầu bảo trì
            $currentMaintenance = DB::table('maintenance_requests')
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $prevMaintenance = DB::table('maintenance_requests')
                ->whereBetween('created_at', [$prevStart, $prevEnd])
                ->count();
            $maintenanceChange = $this->calculatePercentageChange($currentMaintenance, $prevMaintenance);

            // 4. Các chỉ số hoạt động chi tiết phụ thuộc vào loại báo cáo (report_type)
            $tableData = $this->buildTableIndicators($reportType, $start, $end, $prevStart, $prevEnd, $totalProperties, $rentedProperties);

            // 5. Dữ liệu biểu đồ (Chart Data) thật từ Database
            $chartData = $this->buildChartData($start, $end, $reportType);

            return [
                'status' => 'success',
                'meta' => [
                    'report_type' => $reportType,
                    'report_period' => $reportPeriod,
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'start_date_formatted' => $start->format('d/m/Y'),
                    'end_date_formatted' => $end->format('d/m/Y'),
                    'period_label' => $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y'),
                    'generated_at' => now()->format('d/m/Y H:i:s'),
                ],
                'kpis' => [
                    'total_revenue' => $currentRevenue,
                    'revenue_change' => $revenueChange,
                    'occupancy_rate' => $occupancyRate,
                    'occupancy_change' => $occupancyChange,
                    'maintenance_requests' => $currentMaintenance,
                    'maintenance_change' => $maintenanceChange,
                    'total_properties' => $totalProperties,
                    'rented_properties' => $rentedProperties,
                    'vacant_properties' => max(0, $totalProperties - $rentedProperties),
                ],
                'total_revenue' => $currentRevenue,
                'occupancy_rate' => $occupancyRate,
                'maintenance_requests' => $currentMaintenance,
                'table_data' => $tableData,
                'charts' => $chartData,
            ];
        });

        return response()->json($result);
    }

    /**
     * Xác định Carbon date range dựa trên Kỳ báo cáo hoặc mốc ngày tùy chọn
     */
    private function resolveDateRange(string $period, ?string $startParam, ?string $endParam): array
    {
        $now = now();

        switch ($period) {
            case 'today':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];

            case 'this_week':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];

            case 'this_quarter':
                return [$now->copy()->firstOfQuarter()->startOfDay(), $now->copy()->lastOfQuarter()->endOfDay()];

            case 'this_year':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];

            case 'custom':
                if ($startParam && $endParam) {
                    $s = Carbon::parse($startParam)->startOfDay();
                    $e = Carbon::parse($endParam)->endOfDay();
                    return [$s, $e];
                }
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];

            case 'this_month':
            default:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
        }
    }

    /**
     * Tính toán % tăng trưởng an toàn giữa 2 chu kỳ
     */
    private function calculatePercentageChange($current, $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * Xây dựng dữ liệu Bảng chỉ số hoạt động theo từng loại báo cáo
     */
    private function buildTableIndicators(string $type, Carbon $start, Carbon $end, Carbon $prevStart, Carbon $prevEnd, int $totalProps, int $rentedProps): array
    {
        $rows = [];

        if ($type === 'finance') {
            // 1. Doanh thu thực thu
            $paidRevenue = (float) DB::table('invoices')->where('status', 1)->whereBetween('created_at', [$start, $end])->sum('amount');
            $prevPaidRevenue = (float) DB::table('invoices')->where('status', 1)->whereBetween('created_at', [$prevStart, $prevEnd])->sum('amount');
            $rows[] = [
                'metric' => 'Doanh thu đã thực thu',
                'value' => number_format($paidRevenue, 0, ',', '.') . ' VNĐ',
                'change' => $this->calculatePercentageChange($paidRevenue, $prevPaidRevenue),
                'trend' => $paidRevenue >= $prevPaidRevenue ? 'up' : 'down'
            ];

            // 2. Công nợ / Chờ thanh toán
            $unpaidRevenue = (float) DB::table('invoices')->where('status', 0)->whereBetween('created_at', [$start, $end])->sum('amount');
            $prevUnpaidRevenue = (float) DB::table('invoices')->where('status', 0)->whereBetween('created_at', [$prevStart, $prevEnd])->sum('amount');
            $rows[] = [
                'metric' => 'Công nợ / Chờ thanh toán',
                'value' => number_format($unpaidRevenue, 0, ',', '.') . ' VNĐ',
                'change' => $this->calculatePercentageChange($unpaidRevenue, $prevUnpaidRevenue),
                'trend' => $unpaidRevenue <= $prevUnpaidRevenue ? 'up' : 'down'
            ];

            // 3. Tổng tiền đặt cọc giữ chỗ
            $deposits = (float) DB::table('contracts')->whereBetween('created_at', [$start, $end])->sum('deposit_amount');
            $prevDeposits = (float) DB::table('contracts')->whereBetween('created_at', [$prevStart, $prevEnd])->sum('deposit_amount');
            $rows[] = [
                'metric' => 'Tổng tiền đặt cọc giữ chỗ',
                'value' => number_format($deposits, 0, ',', '.') . ' VNĐ',
                'change' => $this->calculatePercentageChange($deposits, $prevDeposits),
                'trend' => $deposits >= $prevDeposits ? 'up' : 'down'
            ];

            // 4. Chi phí bảo trì phát sinh
            $maintenanceCost = (float) DB::table('maintenance_requests')->whereBetween('created_at', [$start, $end])->sum('cost');
            $prevMaintenanceCost = (float) DB::table('maintenance_requests')->whereBetween('created_at', [$prevStart, $prevEnd])->sum('cost');
            $rows[] = [
                'metric' => 'Chi phí bảo trì phát sinh',
                'value' => number_format($maintenanceCost, 0, ',', '.') . ' VNĐ',
                'change' => $this->calculatePercentageChange($maintenanceCost, $prevMaintenanceCost),
                'trend' => $maintenanceCost <= $prevMaintenanceCost ? 'up' : 'down'
            ];

            // 5. Giá trị hợp đồng trung bình
            $avgContract = (float) DB::table('contracts')->whereBetween('created_at', [$start, $end])->avg('rental_price');
            $prevAvgContract = (float) DB::table('contracts')->whereBetween('created_at', [$prevStart, $prevEnd])->avg('rental_price');
            $rows[] = [
                'metric' => 'Giá trị hợp đồng thuê trung bình',
                'value' => number_format($avgContract, 0, ',', '.') . ' VNĐ/tháng',
                'change' => $this->calculatePercentageChange($avgContract, $prevAvgContract),
                'trend' => $avgContract >= $prevAvgContract ? 'up' : 'down'
            ];

            // 6. Số hóa đơn đã phát hành
            $invoicesCount = DB::table('invoices')->whereBetween('created_at', [$start, $end])->count();
            $prevInvoicesCount = DB::table('invoices')->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Số lượng hóa đơn đã phát hành',
                'value' => $invoicesCount . ' hóa đơn',
                'change' => $this->calculatePercentageChange($invoicesCount, $prevInvoicesCount),
                'trend' => $invoicesCount >= $prevInvoicesCount ? 'up' : 'down'
            ];

        } elseif ($type === 'operation') {
            // Vận hành
            // 1. Tỷ lệ lấp đầy BĐS
            $occRate = $totalProps > 0 ? round(($rentedProps / $totalProps) * 100, 1) : 0;
            $rows[] = [
                'metric' => 'Tỷ lệ lấp đầy phòng/căn hộ',
                'value' => $occRate . '%',
                'change' => 0.0,
                'trend' => 'up'
            ];

            // 2. Bất động sản đang cho thuê
            $rows[] = [
                'metric' => 'Bất động sản đang cho thuê',
                'value' => $rentedProps . ' BĐS',
                'change' => 0.0,
                'trend' => 'up'
            ];

            // 3. Bất động sản còn trống
            $vacant = max(0, $totalProps - $rentedProps);
            $rows[] = [
                'metric' => 'Bất động sản đang trống / sẵn sàng',
                'value' => $vacant . ' BĐS',
                'change' => 0.0,
                'trend' => $vacant === 0 ? 'up' : 'neutral'
            ];

            // 4. Yêu cầu bảo trì tiếp nhận
            $maintCount = DB::table('maintenance_requests')->whereBetween('created_at', [$start, $end])->count();
            $prevMaintCount = DB::table('maintenance_requests')->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Yêu cầu bảo trì mới tiếp nhận',
                'value' => $maintCount . ' yêu cầu',
                'change' => $this->calculatePercentageChange($maintCount, $prevMaintCount),
                'trend' => $maintCount <= $prevMaintCount ? 'up' : 'down'
            ];

            // 5. Yêu cầu bảo trì đang xử lý
            $inProgCount = DB::table('maintenance_requests')->where('status', 'IN_PROGRESS')->whereBetween('created_at', [$start, $end])->count();
            $rows[] = [
                'metric' => 'Yêu cầu bảo trì đang xử lý',
                'value' => $inProgCount . ' yêu cầu',
                'change' => 0.0,
                'trend' => 'neutral'
            ];

            // 6. Yêu cầu bảo trì đã hoàn tất
            $compCount = DB::table('maintenance_requests')->where('status', 'COMPLETED')->whereBetween('created_at', [$start, $end])->count();
            $rows[] = [
                'metric' => 'Yêu cầu bảo trì đã hoàn thành',
                'value' => $compCount . ' yêu cầu',
                'change' => 0.0,
                'trend' => 'up'
            ];

        } elseif ($type === 'tenant') {
            // Khách thuê
            // 1. Khách thuê mới đăng ký
            $newTenants = DB::table('users')->where('role_id', 5)->whereBetween('created_at', [$start, $end])->count();
            $prevNewTenants = DB::table('users')->where('role_id', 5)->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Khách thuê mới đăng ký tài khoản',
                'value' => $newTenants . ' người',
                'change' => $this->calculatePercentageChange($newTenants, $prevNewTenants),
                'trend' => $newTenants >= $prevNewTenants ? 'up' : 'down'
            ];

            // 2. Khách thuê đang có hợp đồng hiệu lực
            $activeTenants = DB::table('contracts')
                ->where('status', 1)
                ->where('start_date', '<=', $end->toDateString())
                ->where('end_date', '>=', $start->toDateString())
                ->distinct('customer_id')
                ->count('customer_id');
            $rows[] = [
                'metric' => 'Khách thuê đang có hợp đồng hiệu lực',
                'value' => $activeTenants . ' người',
                'change' => 0.0,
                'trend' => 'up'
            ];

            // 3. Lịch hẹn xem nhà tiếp nhận
            $appCount = DB::table('appointments')->whereBetween('created_at', [$start, $end])->count();
            $prevAppCount = DB::table('appointments')->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Lịch hẹn xem nhà tiếp nhận',
                'value' => $appCount . ' lịch hẹn',
                'change' => $this->calculatePercentageChange($appCount, $prevAppCount),
                'trend' => $appCount >= $prevAppCount ? 'up' : 'down'
            ];

            // 4. Lịch hẹn hoàn thành
            $appCompleted = DB::table('appointments')->whereIn('status', ['COMPLETED', 'CONFIRMED'])->whereBetween('created_at', [$start, $end])->count();
            $rows[] = [
                'metric' => 'Lịch hẹn đã xác nhận / hoàn thành',
                'value' => $appCompleted . ' lịch hẹn',
                'change' => 0.0,
                'trend' => 'up'
            ];

            // 5. Hợp đồng sắp hết hạn
            $expiringContracts = DB::table('contracts')
                ->where('status', 1)
                ->whereBetween('end_date', [now()->toDateString(), now()->addDays(30)->toDateString()])
                ->count();
            $rows[] = [
                'metric' => 'Hợp đồng sắp hết hạn (30 ngày tới)',
                'value' => $expiringContracts . ' hợp đồng',
                'change' => 0.0,
                'trend' => 'neutral'
            ];

        } else {
            // Tổng quan (Overview - Mặc định)
            // 1. Tổng hợp đồng mới
            $newContracts = DB::table('contracts')->whereBetween('created_at', [$start, $end])->count();
            $prevNewContracts = DB::table('contracts')->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Tổng Hợp đồng mới',
                'value' => (string) $newContracts,
                'change' => $this->calculatePercentageChange($newContracts, $prevNewContracts),
                'trend' => $newContracts >= $prevNewContracts ? 'up' : 'down'
            ];

            // 2. Tổng người thuê mới
            $newTenants = DB::table('users')->where('role_id', 5)->whereBetween('created_at', [$start, $end])->count();
            $prevNewTenants = DB::table('users')->where('role_id', 5)->whereBetween('created_at', [$prevStart, $prevEnd])->count();
            $rows[] = [
                'metric' => 'Tổng Người thuê mới',
                'value' => (string) $newTenants,
                'change' => $this->calculatePercentageChange($newTenants, $prevNewTenants),
                'trend' => $newTenants >= $prevNewTenants ? 'up' : 'down'
            ];

            // 3. Hợp đồng sắp hết hạn
            $expiringContracts = DB::table('contracts')
                ->where('status', 1)
                ->whereBetween('end_date', [now()->toDateString(), now()->addDays(30)->toDateString()])
                ->count();
            $rows[] = [
                'metric' => 'Hợp đồng sắp hết hạn',
                'value' => (string) $expiringContracts,
                'change' => 0.0,
                'trend' => 'neutral'
            ];

            // 4. Yêu cầu đang xử lý
            $processingRequests = DB::table('maintenance_requests')
                ->where('status', 'IN_PROGRESS')
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $prevProcessing = DB::table('maintenance_requests')
                ->where('status', 'IN_PROGRESS')
                ->whereBetween('created_at', [$prevStart, $prevEnd])
                ->count();
            $rows[] = [
                'metric' => 'Yêu cầu đang xử lý',
                'value' => (string) $processingRequests,
                'change' => $this->calculatePercentageChange($processingRequests, $prevProcessing),
                'trend' => $processingRequests <= $prevProcessing ? 'up' : 'down'
            ];

            // 5. Yêu cầu đã hoàn thành
            $completedRequests = DB::table('maintenance_requests')
                ->where('status', 'COMPLETED')
                ->whereBetween('created_at', [$start, $end])
                ->count();
            $prevCompleted = DB::table('maintenance_requests')
                ->where('status', 'COMPLETED')
                ->whereBetween('created_at', [$prevStart, $prevEnd])
                ->count();
            $rows[] = [
                'metric' => 'Yêu cầu đã hoàn thành',
                'value' => (string) $completedRequests,
                'change' => $this->calculatePercentageChange($completedRequests, $prevCompleted),
                'trend' => $completedRequests >= $prevCompleted ? 'up' : 'down'
            ];
        }

        return $rows;
    }

    /**
     * Tổng hợp dữ liệu biểu đồ thật từ Database
     */
    private function buildChartData(Carbon $start, Carbon $end, string $type): array
    {
        $diffDays = $start->diffInDays($end);

        // 1. Biểu đồ đường Doanh thu theo thời gian (Timeline)
        $timelineLabels = [];
        $timelineRevenue = [];
        $timelineContracts = [];

        if ($diffDays <= 31) {
            // Thống kê theo từng ngày
            $cursor = $start->copy();
            while ($cursor <= $end) {
                $dayStr = $cursor->format('Y-m-d');
                $label = $cursor->format('d/m');
                $timelineLabels[] = $label;

                $rev = (float) DB::table('invoices')
                    ->where('status', 1)
                    ->whereDate('created_at', $dayStr)
                    ->sum('amount');
                $timelineRevenue[] = $rev;

                $cnt = DB::table('contracts')
                    ->whereDate('created_at', $dayStr)
                    ->count();
                $timelineContracts[] = $cnt;

                $cursor->addDay();
            }
        } else {
            // Thống kê theo từng tháng
            $cursor = $start->copy()->startOfMonth();
            while ($cursor <= $end) {
                $monthStr = $cursor->format('Y-m');
                $label = 'T' . $cursor->format('m/Y');
                $timelineLabels[] = $label;

                $rev = (float) DB::table('invoices')
                    ->where('status', 1)
                    ->whereYear('created_at', $cursor->year)
                    ->whereMonth('created_at', $cursor->month)
                    ->sum('amount');
                $timelineRevenue[] = $rev;

                $cnt = DB::table('contracts')
                    ->whereYear('created_at', $cursor->year)
                    ->whereMonth('created_at', $cursor->month)
                    ->count();
                $timelineContracts[] = $cnt;

                $cursor->addMonth();
            }
        }

        // 2. Biểu đồ tròn / thanh: Phân bổ trạng thái yêu cầu bảo trì
        $maintenanceStatus = [
            'labels' => ['Chờ xử lý', 'Đang xử lý', 'Đã hoàn thành'],
            'data' => [
                DB::table('maintenance_requests')->where('status', 'PENDING')->whereBetween('created_at', [$start, $end])->count(),
                DB::table('maintenance_requests')->where('status', 'IN_PROGRESS')->whereBetween('created_at', [$start, $end])->count(),
                DB::table('maintenance_requests')->where('status', 'COMPLETED')->whereBetween('created_at', [$start, $end])->count(),
            ]
        ];

        // 3. Biểu đồ cột: Thống kê Bất động sản theo Loại BĐS
        $propertyTypes = DB::table('property_types')
            ->leftJoin('properties', 'property_types.id', '=', 'properties.property_type_id')
            ->select('property_types.name', DB::raw('count(properties.id) as total'))
            ->groupBy('property_types.id', 'property_types.name')
            ->get();

        return [
            'timeline' => [
                'labels' => $timelineLabels,
                'revenue' => $timelineRevenue,
                'contracts' => $timelineContracts,
            ],
            'maintenance_status' => $maintenanceStatus,
            'property_types' => [
                'labels' => $propertyTypes->pluck('name')->toArray(),
                'data' => $propertyTypes->pluck('total')->toArray(),
            ]
        ];
    }
}
