<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Services\RevenueStatsService;

class DashboardController extends Controller
{
    protected RevenueStatsService $revenueService;

    public function __construct(RevenueStatsService $revenueService)
    {
        $this->revenueService = $revenueService;
    }

    /**
     * API Tổng quan Dashboard (Real-time tracking từ Database)
     */
    public function getOverview(Request $request)
    {
        // Cache nhẹ 10 giây để tăng tốc độ phản hồi tối đa mà vẫn cập nhật tức thì khi có biến động
        $data = Cache::remember('dashboard_overview_data', 10, function () {
            $now = $this->revenueService->now();

            // 1. Thẻ 1: Căn hộ đang thuê & Tổng số căn
            $totalProperties = DB::table('properties')->whereNull('deleted_at')->count();
            $rentedProperties = DB::table('contracts')
                ->where('status', 1)
                ->where('start_date', '<=', $now->toDateString())
                ->where('end_date', '>=', $now->toDateString())
                ->distinct('property_id')
                ->count('property_id');
            $vacantProperties = max(0, $totalProperties - $rentedProperties);

            // 2. Thẻ 2: Tỷ lệ lấp đầy
            $occupancyRate = $totalProperties > 0 ? round(($rentedProperties / $totalProperties) * 100, 1) : 0;
            // Lấy dữ liệu phân bổ loại hình BĐS làm mini bar chart cho tỷ lệ lấp đầy
            $propertyTypesOccupancy = DB::table('property_types')
                ->leftJoin('properties', 'property_types.id', '=', 'properties.property_type_id')
                ->select(
                    'property_types.name',
                    DB::raw('count(properties.id) as total')
                )
                ->groupBy('property_types.id', 'property_types.name')
                ->limit(5)
                ->get();

            // 3. Thẻ 3: Tổng thu tháng này (Thực thu trong tháng theo ngày paid_at, timezone Asia/Ho_Chi_Minh [startOfMonth, startOfNextMonth))
            $currentMonthRevenue = $this->revenueService->getCurrentMonthRevenue($now);

            // 4. Thẻ 4: Doanh thu so với tháng trước (% tăng trưởng và chuỗi mini line sparkline)
            $growthRate = $this->revenueService->getMonthGrowthRate($now);
            $sparkline = $this->revenueService->getMonthlySparkline(6, $now);
            $sparklineLabels = $sparkline['labels'];
            $sparklineData = $sparkline['data'];

            // 5. Thẻ 5: Hợp đồng sắp hết hạn (trong vòng 30 ngày tới)
            $expiringContracts = DB::table('contracts')
                ->where('status', 1)
                ->whereBetween('end_date', [$now->toDateString(), $now->copy()->addDays(30)->toDateString()])
                ->count();

            // 6. Thẻ 6: Yêu cầu bảo trì đang xử lý
            $inProgressMaintenance = DB::table('maintenance_requests')
                ->where('status', 'IN_PROGRESS')
                ->count();
            $totalMaintenance = DB::table('maintenance_requests')->count();

            // 7. Bảng "Hoạt động gần đây" (Recent Activities)
            $activities = $this->getRecentActivities();

            return [
                'cards' => [
                    'rented' => [
                        'rented_count' => $rentedProperties,
                        'total_count' => $totalProperties,
                        'vacant_count' => $vacantProperties,
                        'display' => $rentedProperties . ' / Tổng số ' . $totalProperties . ' căn',
                    ],
                    'occupancy' => [
                        'rate' => $occupancyRate,
                        'display' => $occupancyRate . '%',
                        'types_distribution' => $propertyTypesOccupancy,
                    ],
                    'revenue' => [
                        'amount' => $currentMonthRevenue,
                        'display' => number_format($currentMonthRevenue, 0, ',', '.') . ' VNĐ',
                        'month_label' => 'Tháng ' . $now->format('m/Y'),
                    ],
                    'growth' => [
                        'rate' => $growthRate,
                        'is_positive' => $growthRate >= 0,
                        'display' => ($growthRate >= 0 ? '+' : '') . $growthRate . '%',
                        'sparkline_labels' => $sparklineLabels,
                        'sparkline_data' => $sparklineData,
                    ],
                    'expiring_contracts' => [
                        'count' => $expiringContracts,
                        'display' => (string) $expiringContracts,
                        'threshold_days' => 30,
                    ],
                    'maintenance' => [
                        'in_progress' => $inProgressMaintenance,
                        'total' => $totalMaintenance,
                        'display' => (string) $inProgressMaintenance,
                    ],
                ],
                'recent_activities' => $activities,
                'meta' => [
                    'updated_at' => $now->format('d/m/Y H:i:s'),
                    'current_date' => $now->format('d/m/Y'),
                ],
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Thu thập danh sách hoạt động mới nhất từ các bảng nghiệp vụ thực tế
     */
    private function getRecentActivities(): array
    {
        $activities = collect();

        // 1. Hợp đồng mới gần đây
        $recentContracts = DB::table('contracts')
            ->leftJoin('properties', 'contracts.property_id', '=', 'properties.id')
            ->leftJoin('users', 'contracts.customer_id', '=', 'users.id')
            ->select(
                'contracts.id',
                'contracts.contract_code',
                'contracts.contract_name',
                'contracts.rental_price',
                'contracts.created_at',
                'properties.title as property_title',
                'users.name as customer_name'
            )
            ->orderBy('contracts.created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentContracts as $c) {
            $propName = $c->property_title ? $c->property_title : ('Hợp đồng #' . $c->contract_code);
            $activities->push([
                'type' => 'CONTRACT',
                'badge' => 'Hợp đồng mới',
                'badge_color' => 'blue',
                'content' => 'Hợp đồng mới: ' . $propName . ($c->customer_name ? ' (' . $c->customer_name . ')' : ''),
                'detail' => number_format($c->rental_price, 0, ',', '.') . ' VNĐ/tháng',
                'created_at' => $c->created_at,
                'time_formatted' => Carbon::parse($c->created_at)->format('d/m/Y H:i'),
            ]);
        }

        // 2. Thanh toán / Hóa đơn đã thanh toán gần đây (Dựa theo ngày thu tiền thực tế paid_at)
        $paymentActivities = $this->revenueService->getRecentPayments(5);
        foreach ($paymentActivities as $payment) {
            $activities->push($payment);
        }

        // 3. Yêu cầu bảo trì / sửa chữa gần đây
        $recentMaintenance = DB::table('maintenance_requests')
            ->leftJoin('properties', 'maintenance_requests.property_id', '=', 'properties.id')
            ->select(
                'maintenance_requests.id',
                'maintenance_requests.title',
                'maintenance_requests.status',
                'maintenance_requests.priority',
                'maintenance_requests.created_at',
                'properties.title as property_title'
            )
            ->orderBy('maintenance_requests.created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentMaintenance as $m) {
            $prop = $m->property_title ? (' (' . $m->property_title . ')') : '';
            $statusText = $m->status === 'COMPLETED' ? 'Đã hoàn thành' : ($m->status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Chờ tiếp nhận');
            $activities->push([
                'type' => 'MAINTENANCE',
                'badge' => 'Yêu cầu bảo trì',
                'badge_color' => 'amber',
                'content' => 'Yêu cầu bảo trì: ' . $m->title . $prop,
                'detail' => $statusText,
                'created_at' => $m->created_at,
                'time_formatted' => Carbon::parse($m->created_at)->format('d/m/Y H:i'),
            ]);
        }

        // 4. Lịch hẹn xem nhà gần đây
        $recentAppointments = DB::table('appointments')
            ->leftJoin('properties', 'appointments.property_id', '=', 'properties.id')
            ->leftJoin('users', 'appointments.customer_id', '=', 'users.id')
            ->select(
                'appointments.id',
                'appointments.appointment_time',
                'appointments.status',
                'appointments.created_at',
                'properties.title as property_title',
                'users.name as customer_name'
            )
            ->orderBy('appointments.created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentAppointments as $app) {
            $client = $app->customer_name ? $app->customer_name : 'Khách hàng';
            $prop = $app->property_title ? (' xem ' . $app->property_title) : '';
            $activities->push([
                'type' => 'APPOINTMENT',
                'badge' => 'Lịch hẹn mới',
                'badge_color' => 'purple',
                'content' => 'Lịch hẹn xem nhà: ' . $client . $prop,
                'detail' => Carbon::parse($app->appointment_time)->format('d/m/Y H:i'),
                'created_at' => $app->created_at,
                'time_formatted' => Carbon::parse($app->created_at)->format('d/m/Y H:i'),
            ]);
        }

        // Sắp xếp toàn bộ sự kiện theo thời gian mới nhất và lấy 10 mục
        return $activities
            ->sortByDesc('created_at')
            ->values()
            ->take(10)
            ->all();
    }
}
