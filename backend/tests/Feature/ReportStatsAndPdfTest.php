<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\RevenueStatsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportStatsAndPdfTest extends TestCase
{
    use RefreshDatabase;

    protected RevenueStatsService $revenueService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->revenueService = app(RevenueStatsService::class);
        Cache::flush();
    }

    private function createAdminUser(): User
    {
        if (!Role::find(1)) {
            Role::forceCreate(['id' => 1, 'name' => 'Admin']);
        }
        return User::create([
            'name' => 'Quản trị viên',
            'email' => 'admin_report_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role_id' => 1,
            'is_active' => true,
        ]);
    }

    private function createContractAndGetId(User $user): int
    {
        $propId = DB::table('properties')->insertGetId([
            'title' => 'Căn hộ P.202',
            'price' => 15000000,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('contracts')->insertGetId([
            'contract_code' => 'HD-' . strtoupper(uniqid()),
            'contract_name' => 'Hợp đồng thuê căn hộ kiểm thử',
            'property_id' => $propId,
            'customer_id' => $user->id,
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
            'rental_price' => 15000000,
            'deposit_amount' => 15000000,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createInvoice(array $data): int
    {
        $defaults = [
            'title' => 'Hóa đơn kiểm thử',
            'invoice_no' => 'INV-' . strtoupper(uniqid()),
            'issue_date' => now()->toDateString(),
            'type' => 'rent',
            'amount' => 10000000,
            'paid_amount' => 0,
            'due_date' => now()->toDateString(),
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        return DB::table('invoices')->insertGetId(array_merge($defaults, $data));
    }

    /**
     * Test 1: Cùng kỳ thì số liệu Doanh thu thực thu Dashboard = Báo cáo (cùng RevenueStatsService)
     */
    public function test_dashboard_and_report_revenue_match_for_same_period(): void
    {
        $admin = $this->createAdminUser();
        $contractId = $this->createContractAndGetId($admin);

        $now = $this->revenueService->now();
        $thisMonthPaidAt1 = $now->copy()->startOfMonth()->addDays(2)->format('Y-m-d 10:00:00');
        $thisMonthPaidAt2 = $now->copy()->startOfMonth()->addDays(5)->format('Y-m-d 14:00:00');
        $lastMonthPaidAt = $now->copy()->subMonth()->startOfMonth()->addDays(10)->format('Y-m-d 09:00:00');

        // Hóa đơn 1: Thu trong tháng này 10,000,000 VNĐ
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê tháng này đợt 1',
            'amount' => 10000000,
            'paid_amount' => 10000000,
            'status' => 1,
            'paid_at' => $thisMonthPaidAt1,
        ]);

        // Hóa đơn 2: Thu trong tháng này 5,500,000 VNĐ (tạo từ tháng trước nhưng thu tháng này)
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền dịch vụ thanh toán tháng này',
            'amount' => 5500000,
            'paid_amount' => 5500000,
            'status' => 1,
            'created_at' => $now->copy()->subMonth()->format('Y-m-d 10:00:00'),
            'paid_at' => $thisMonthPaidAt2,
        ]);

        // Hóa đơn 3: Thu trong tháng trước 8,000,000 VNĐ (không được tính vào tháng này)
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê tháng trước',
            'amount' => 8000000,
            'paid_amount' => 8000000,
            'status' => 1,
            'paid_at' => $lastMonthPaidAt,
        ]);

        // Hóa đơn 4: Chưa thanh toán (status = 0, paid_at = null)
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Hóa đơn chưa thanh toán',
            'amount' => 3000000,
            'paid_amount' => 0,
            'status' => 0,
            'paid_at' => null,
        ]);

        Cache::flush();

        // 1. Gọi API Dashboard
        $resDashboard = $this->actingAs($admin, 'sanctum')->getJson('/api/dashboard/overview');
        $resDashboard->assertStatus(200);
        $dashboardRevenue = (float) $resDashboard->json('data.cards.revenue.amount');

        // 2. Gọi API Báo cáo Tổng quan cùng kỳ Tháng này
        $resReportOverview = $this->actingAs($admin, 'sanctum')->getJson('/api/reports/statistics?report_type=overview&report_period=this_month');
        $resReportOverview->assertStatus(200);
        $reportOverviewRevenue = (float) $resReportOverview->json('kpis.total_revenue');

        // 3. Gọi API Báo cáo Tài chính cùng kỳ Tháng này
        $resReportFinance = $this->actingAs($admin, 'sanctum')->getJson('/api/reports/statistics?report_type=finance&report_period=this_month');
        $resReportFinance->assertStatus(200);
        $reportFinanceRevenue = (float) $resReportFinance->json('kpis.total_revenue');

        // Khẳng định: Doanh thu thực thu Dashboard = Báo cáo = 15,500,000 VNĐ
        $this->assertEquals(15500000.0, $dashboardRevenue);
        $this->assertEquals(15500000.0, $reportOverviewRevenue);
        $this->assertEquals(15500000.0, $reportFinanceRevenue);
        $this->assertEquals($dashboardRevenue, $reportOverviewRevenue);
        $this->assertEquals($dashboardRevenue, $reportFinanceRevenue);
    }

    /**
     * Test 2: Kỳ rỗng hoặc cơ sở dữ liệu chưa có dữ liệu phát sinh -> vẫn trả HTTP 200 và số liệu 0 an toàn
     */
    public function test_empty_period_or_empty_database_returns_200_with_zero_stats(): void
    {
        $admin = $this->createAdminUser();
        Cache::flush();

        // Gọi API Báo cáo Tổng quan khi không có hợp đồng / hóa đơn / bảo trì nào
        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/reports/statistics?report_type=overview&report_period=this_month');
        $res->assertStatus(200);

        // Số liệu KPI = 0 (không chia cho 0, không null)
        $this->assertSame(0.0, (float) $res->json('kpis.total_revenue'));
        $this->assertSame(0.0, (float) $res->json('kpis.revenue_change'));
        $this->assertSame(0.0, (float) $res->json('kpis.occupancy_rate'));
        $this->assertSame(0.0, (float) $res->json('kpis.occupancy_change'));
        $this->assertSame(0, $res->json('kpis.maintenance_requests'));
        $this->assertSame(0.0, (float) $res->json('kpis.maintenance_change'));

        // Bảng chỉ số vẫn đầy đủ các dòng với giá trị 0
        $tableData = $res->json('table_data');
        $this->assertIsArray($tableData);
        $this->assertNotEmpty($tableData);

        foreach ($tableData as $row) {
            $this->assertArrayHasKey('metric', $row);
            $this->assertArrayHasKey('value', $row);
            $this->assertArrayHasKey('change', $row);
            $this->assertArrayHasKey('trend', $row);
            $this->assertEquals(0.0, (float) $row['change']);
        }

        // Biểu đồ trả về danh sách giá trị 0
        $charts = $res->json('charts');
        $this->assertIsArray($charts['timeline']['revenue']);
        foreach ($charts['timeline']['revenue'] as $rev) {
            $this->assertEquals(0.0, (float) $rev);
        }
    }

    /**
     * Test 3: Kỳ rỗng vẫn xuất PDF thành công (HTTP 200, Content-Type application/pdf, file PDF hợp lệ)
     */
    public function test_empty_period_pdf_export_returns_200_and_generates_valid_pdf(): void
    {
        $admin = $this->createAdminUser();
        Cache::flush();

        // 1. Xuất PDF Báo cáo Tổng quan
        $resOverviewPdf = $this->actingAs($admin, 'sanctum')->get('/api/reports/statistics/pdf?report_type=overview&report_period=this_month');
        $resOverviewPdf->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $resOverviewPdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $resOverviewPdf->getContent());

        // 2. Xuất PDF Báo cáo Tài chính
        $resFinancePdf = $this->actingAs($admin, 'sanctum')->get('/api/reports/statistics/pdf?report_type=finance&report_period=this_month');
        $resFinancePdf->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $resFinancePdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $resFinancePdf->getContent());

        // 3. Xuất PDF Báo cáo Vận hành
        $resOpPdf = $this->actingAs($admin, 'sanctum')->get('/api/reports/statistics/pdf?report_type=operation&report_period=this_month');
        $resOpPdf->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $resOpPdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $resOpPdf->getContent());
    }

    /**
     * Test 4: Báo cáo với khoảng ngày tùy chọn (custom) áp dụng đúng quy ước khoảng nửa mở [start, end)
     */
    public function test_report_custom_date_range_uses_half_open_interval(): void
    {
        $admin = $this->createAdminUser();
        $contractId = $this->createContractAndGetId($admin);

        // Tạo 3 giao dịch:
        // Tx1: đúng lúc 00:00:00 ngày bắt đầu -> NẰM TRONG KỲ
        $this->createInvoice([
            'contract_id' => $contractId,
            'amount' => 4000000,
            'paid_amount' => 4000000,
            'status' => 1,
            'paid_at' => '2026-06-01 00:00:00',
        ]);

        // Tx2: đúng lúc 23:59:59 ngày kết thúc -> NẰM TRONG KỲ
        $this->createInvoice([
            'contract_id' => $contractId,
            'amount' => 6000000,
            'paid_amount' => 6000000,
            'status' => 1,
            'paid_at' => '2026-06-30 23:59:59',
        ]);

        // Tx3: lúc 00:00:01 ngày hôm sau -> NẰM NGOÀI KỲ
        $this->createInvoice([
            'contract_id' => $contractId,
            'amount' => 9000000,
            'paid_amount' => 9000000,
            'status' => 1,
            'paid_at' => '2026-07-01 00:00:01',
        ]);

        Cache::flush();

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/reports/statistics?report_period=custom&start_date=2026-06-01&end_date=2026-06-30');
        $res->assertStatus(200);

        // Tổng thu trong kỳ là Tx1 + Tx2 = 10,000,000 VNĐ
        $this->assertEquals(10000000.0, (float) $res->json('kpis.total_revenue'));
    }

    /**
     * Test 5: Tất cả 4 loại báo cáo (overview, finance, operation, tenant) đều trả 200 và đủ dữ liệu bảng
     */
    public function test_all_report_types_return_200_with_valid_indicators(): void
    {
        $admin = $this->createAdminUser();
        Cache::flush();

        $types = ['overview', 'finance', 'operation', 'tenant'];

        foreach ($types as $type) {
            $res = $this->actingAs($admin, 'sanctum')->getJson("/api/reports/statistics?report_type={$type}&report_period=this_month");
            $res->assertStatus(200);
            $this->assertEquals('success', $res->json('status'));
            $this->assertIsArray($res->json('table_data'));
            $this->assertNotEmpty($res->json('table_data'));
        }
    }
}
