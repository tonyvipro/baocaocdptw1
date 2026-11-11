<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\RevenueStatsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RevenueStatsTest extends TestCase
{
    use RefreshDatabase;

    protected RevenueStatsService $revenueService;
    protected Carbon $now;

    
    protected function setUp(): void
    {
        parent::setUp();
        $this->revenueService = app(RevenueStatsService::class);
        $this->now = Carbon::parse('2026-11-10 14:00:00', RevenueStatsService::TIMEZONE);
    }

    private function createAdminUser(): User
    {
        if (!Role::find(1)) {
            Role::forceCreate(['id' => 1, 'name' => 'Admin']);
        }
        return User::create([
            'name' => 'Quản trị viên',
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => 'password123',
            'role_id' => 1,
            'is_active' => true,
        ]);
    }

    private function createContractAndGetId(): int
    {
        $user = $this->createAdminUser();

        $typeId = DB::table('property_types')->insertGetId([
            'name' => 'Căn hộ dịch vụ',
            'slug' => 'can-ho-dich-vu-' . uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $propId = DB::table('properties')->insertGetId([
            'title' => 'Căn hộ P.101',
            'property_type_id' => $typeId,
            'price' => 10000000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('contracts')->insertGetId([
            'contract_code' => 'HD-' . uniqid(),
            'contract_name' => 'Hợp đồng thuê căn hộ',
            'property_id' => $propId,
            'customer_id' => $user->id,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'rental_price' => 10000000,
            'deposit_amount' => 10000000,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createInvoice(array $data): int
    {
        $defaults = [
            'invoice_no' => 'INV-' . strtoupper(uniqid()),
            'issue_date' => '2026-10-01',
            'type' => 'rent',
            'amount' => 10000000,
            'paid_amount' => 0,
            'due_date' => '2026-10-25',
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        return DB::table('invoices')->insertGetId(array_merge($defaults, $data));
    }

    /**
     * Test 1: Hóa đơn TẠO tháng trước nhưng THU trong tháng này -> PHẢI được tính vào tháng này
     */
    public function test_invoice_created_last_month_but_paid_this_month_is_counted_in_current_month(): void
    {
        $contractId = $this->createContractAndGetId();

        $lastMonthCreatedAt = '2026-10-15 10:00:00';
        $thisMonthPaidAt = '2026-11-05 15:30:00';

        // Tạo hóa đơn tạo vào 15/10/2026 nhưng khách thanh toán vào 05/11/2026
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê tháng 10 trả chậm vào tháng 11',
            'type' => 'rent',
            'amount' => 12000000,
            'paid_amount' => 12000000,
            'due_date' => '2026-10-25',
            'status' => 1, // Đã thanh toán
            'paid_at' => $thisMonthPaidAt,
            'created_at' => $lastMonthCreatedAt,
            'updated_at' => $thisMonthPaidAt,
        ]);

        $currentMonthRevenue = $this->revenueService->getCurrentMonthRevenue($this->now);
        $prevMonthRevenue = $this->revenueService->getPreviousMonthRevenue($this->now);

        // Doanh thu tháng này PHẢI có 12,000,000 VNĐ
        $this->assertEquals(12000000.00, $currentMonthRevenue, 'Hóa đơn thu trong tháng 11 phải được tính vào doanh thu tháng 11');
        // Doanh thu tháng trước KHÔNG được tính khoản này
        $this->assertEquals(0.00, $prevMonthRevenue, 'Hóa đơn thu trong tháng 11 không được tính vào doanh thu tháng 10');
    }

    /**
     * Test 2: Hóa đơn TẠO tháng này nhưng THU tháng sau hoặc CHƯA thu -> KHÔNG được tính vào tháng này
     */
    public function test_invoice_created_this_month_but_paid_next_month_or_unpaid_is_not_counted_in_current_month(): void
    {
        $contractId = $this->createContractAndGetId();

        $thisMonthCreatedAt = '2026-11-02 09:00:00';
        $nextMonthPaidAt = '2026-12-03 14:00:00';

        // Hóa đơn 1: Tạo tháng 11 nhưng sang tháng 12 mới thu tiền
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê tháng 11 thu vào tháng 12',
            'type' => 'rent',
            'amount' => 15000000,
            'paid_amount' => 15000000,
            'due_date' => '2026-11-25',
            'status' => 1,
            'paid_at' => $nextMonthPaidAt,
            'created_at' => $thisMonthCreatedAt,
            'updated_at' => $nextMonthPaidAt,
        ]);

        // Hóa đơn 2: Tạo tháng 11 nhưng chưa thanh toán (status = 0, paid_at = null)
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền điện nước chưa thu',
            'type' => 'utility',
            'amount' => 3000000,
            'paid_amount' => 0,
            'due_date' => '2026-11-20',
            'status' => 0,
            'paid_at' => null,
            'created_at' => $thisMonthCreatedAt,
            'updated_at' => $thisMonthCreatedAt,
        ]);

        $currentMonthRevenue = $this->revenueService->getCurrentMonthRevenue($this->now);

        // Doanh thu tháng này phải bằng 0 (không bị tính nhầm theo created_at)
        $this->assertEquals(0.00, $currentMonthRevenue, 'Hóa đơn chưa thu hoặc thu vào tháng 12 không được tính vào doanh thu tháng 11');
    }

    /**
     * Test 3: Thanh toán một phần bằng transactions được phân bổ chính xác theo ngày thu từng đợt
     */
    public function test_partial_payment_via_transactions_allocated_to_respective_months(): void
    {
        $contractId = $this->createContractAndGetId();

        $invoiceId = $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Hóa đơn thanh toán làm 2 đợt',
            'type' => 'rent',
            'amount' => 20000000,
            'paid_amount' => 20000000,
            'due_date' => '2026-10-30',
            'status' => 1,
            'paid_at' => '2026-11-08 10:00:00',
            'created_at' => '2026-10-15 08:00:00',
            'updated_at' => '2026-11-08 10:00:00',
        ]);

        // Đợt 1: Trả 6,000,000 VNĐ vào tháng 10 (20/10/2026)
        DB::table('transactions')->insert([
            'invoice_id' => $invoiceId,
            'transaction_code' => 'TXN-OCT-01',
            'amount' => 6000000,
            'payment_method' => 'bank_transfer',
            'paid_at' => '2026-10-20 11:00:00',
            'status' => 1,
            'created_at' => '2026-10-20 11:00:00',
            'updated_at' => '2026-10-20 11:00:00',
        ]);

        // Đợt 2: Trả 14,000,000 VNĐ vào tháng 11 (08/11/2026)
        DB::table('transactions')->insert([
            'invoice_id' => $invoiceId,
            'transaction_code' => 'TXN-NOV-01',
            'amount' => 14000000,
            'payment_method' => 'bank_transfer',
            'paid_at' => '2026-11-08 10:00:00',
            'status' => 1,
            'created_at' => '2026-11-08 10:00:00',
            'updated_at' => '2026-11-08 10:00:00',
        ]);

        $prevMonthRevenue = $this->revenueService->getPreviousMonthRevenue($this->now);
        $currentMonthRevenue = $this->revenueService->getCurrentMonthRevenue($this->now);

        $this->assertEquals(6000000.00, $prevMonthRevenue, 'Đợt 1 thu vào tháng 10 phải tính đúng 6 triệu vào tháng 10');
        $this->assertEquals(14000000.00, $currentMonthRevenue, 'Đợt 2 thu vào tháng 11 phải tính đúng 14 triệu vào tháng 11');

        // Tỷ lệ tăng trưởng tháng 11 so với tháng 10: ((14 - 6) / 6) * 100 = 133.3%
        $growthRate = $this->revenueService->getMonthGrowthRate($this->now);
        $this->assertEquals(133.3, $growthRate);
    }

    /**
     * Test 4: Ranh giới khoảng nửa mở [startOfMonth, startOfNextMonth) chuẩn xác từng giây
     */
    public function test_half_open_interval_boundaries(): void
    {
        $contractId = $this->createContractAndGetId();

        // Điểm đầu: đúng 00:00:00 ngày đầu tháng 11 -> ĐƯỢC tính vào tháng 11
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Đúng 00:00:00 ngày đầu tháng',
            'type' => 'rent',
            'amount' => 5000000,
            'paid_amount' => 5000000,
            'due_date' => '2026-11-05',
            'status' => 1,
            'paid_at' => '2026-11-01 00:00:00',
            'created_at' => '2026-10-31 23:50:00',
            'updated_at' => '2026-11-01 00:00:00',
        ]);

        // Điểm cuối ranh giới mở: đúng 00:00:00 ngày đầu tháng sau (12) -> KHÔNG tính vào tháng 11
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Đúng 00:00:00 ngày đầu tháng sau',
            'type' => 'rent',
            'amount' => 7000000,
            'paid_amount' => 7000000,
            'due_date' => '2026-11-30',
            'status' => 1,
            'paid_at' => '2026-12-01 00:00:00',
            'created_at' => '2026-11-30 20:00:00',
            'updated_at' => '2026-12-01 00:00:00',
        ]);

        $currentMonthRevenue = $this->revenueService->getCurrentMonthRevenue($this->now);
        $this->assertEquals(5000000.00, $currentMonthRevenue, 'Chỉ khoản tại 00:00:00 ngày 01/11 được tính, 00:00:00 ngày 01/12 thuộc về tháng sau');
    }

    /**
     * Test 5: API Dashboard Overview trả về doanh thu thực thu theo ngày paid_at
     */
    public function test_dashboard_overview_api_returns_actual_revenue_based_on_paid_at(): void
    {
        $admin = $this->createAdminUser();
        $contractId = $this->createContractAndGetId();

        // Tạo hóa đơn tạo tháng 10 nhưng thu tiền trong tháng 11
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê căn hộ P.101',
            'type' => 'rent',
            'amount' => 18500000,
            'paid_amount' => 18500000,
            'due_date' => '2026-10-25',
            'status' => 1,
            'paid_at' => now()->startOfMonth()->addDays(2)->toDateTimeString(),
            'created_at' => now()->subMonth()->startOfMonth()->toDateTimeString(),
            'updated_at' => now()->startOfMonth()->addDays(2)->toDateTimeString(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/dashboard/overview');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'cards' => [
                        'rented',
                        'occupancy',
                        'revenue' => ['amount', 'display', 'month_label'],
                        'growth' => ['rate', 'sparkline_data', 'sparkline_labels'],
                        'expiring_contracts',
                        'maintenance',
                    ],
                    'recent_activities',
                ],
            ]);

        $actualAmount = $response->json('data.cards.revenue.amount');
        $this->assertEquals(18500000.00, (float) $actualAmount, 'API Dashboard phải trả về đúng số tiền thực thu trong tháng');
    }

    /**
     * Test 6: API Báo cáo thống kê (ReportController) trả về doanh thu thực thu theo ngày paid_at
     */
    public function test_report_statistics_api_returns_actual_revenue_based_on_paid_at(): void
    {
        $admin = $this->createAdminUser();
        $contractId = $this->createContractAndGetId();

        // Tạo hóa đơn tạo tháng trước (tháng 10), thanh toán vào ngày 03 của tháng hiện tại
        $this->createInvoice([
            'contract_id' => $contractId,
            'title' => 'Tiền thuê tháng trước thu tháng này',
            'type' => 'rent',
            'amount' => 25000000,
            'paid_amount' => 25000000,
            'due_date' => '2026-10-25',
            'status' => 1,
            'paid_at' => now()->startOfMonth()->addDays(2)->toDateTimeString(),
            'created_at' => now()->subMonth()->startOfMonth()->toDateTimeString(),
            'updated_at' => now()->startOfMonth()->addDays(2)->toDateTimeString(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/reports/statistics?report_type=finance&report_period=this_month');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'meta',
                'kpis' => [
                    'total_revenue',
                    'revenue_change',
                ],
                'table_data',
                'charts',
            ]);

        $reportRevenue = $response->json('kpis.total_revenue');
        $this->assertEquals(25000000.00, (float) $reportRevenue, 'Báo cáo thống kê tài chính phải tính đúng doanh thu thực thu theo paid_at');
    }
}
