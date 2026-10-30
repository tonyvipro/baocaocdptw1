<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Enums\TransactionSource;
use App\Queries\RentPaymentQuery;
use Carbon\Carbon;
use Illuminate\Support\Str;

class RentPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Cố định thời gian test: 2026-10-26 (trùng với ngữ cảnh hệ thống)
        Carbon::setTestNow(Carbon::parse('2026-10-26 10:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeUser(int $roleId, ?string $email = null): User
    {
        if (!\App\Models\Role::find($roleId)) {
            \App\Models\Role::forceCreate(['id' => $roleId, 'name' => 'Role ' . $roleId]);
        }

        return User::create([
            'name' => 'Người dùng test ' . uniqid(),
            'email' => $email ?? (uniqid() . '@test.vn'),
            'password' => bcrypt('password123'),
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    private function makeProperty(?string $code = null): Property
    {
        return Property::create([
            'code' => $code ?? ('PROP-' . Str::random(5)),
            'title' => 'Căn hộ chung cư ' . Str::random(5),
            'address' => 'Số 123 Đường Test, Quận 1, TP. HCM',
            'price' => 15000000,
            'price_rent' => 15000000,
            'deposit' => 30000000,
            'area' => 70,
            'status' => 1,
            'purpose' => 'rent',
        ]);
    }

    private function makeContract(User $broker, User $customer, ?Property $property = null, array $attributes = []): Contract
    {
        $property = $property ?? $this->makeProperty();

        return Contract::create(array_merge([
            'contract_code' => 'HD-' . Str::upper(Str::random(6)),
            'contract_name' => 'Hợp đồng thuê căn ' . $property->code,
            'property_id' => $property->id,
            'customer_id' => $customer->id,
            'broker_id' => $broker->id,
            'start_date' => Carbon::now()->subMonths(3)->toDateString(),
            'end_date' => Carbon::now()->addMonths(9)->toDateString(),
            'rental_price' => 15000000,
            'deposit_amount' => 30000000,
            'currency' => 'VND',
            'billing_cycle' => 1,
            'status' => 1,
        ], $attributes));
    }

    private function makeRentInvoice(Contract $contract, array $attributes = []): Invoice
    {
        return Invoice::create(array_merge([
            'invoice_no' => 'QLTT-INV-' . Carbon::now()->format('Ym') . '-TEST-' . Str::upper(Str::random(4)),
            'contract_id' => $contract->id,
            'issue_date' => Carbon::now()->startOfMonth()->toDateString(),
            'due_date' => Carbon::now()->addDays(5)->toDateString(),
            'billing_period_start' => Carbon::now()->startOfMonth()->toDateString(),
            'billing_period_end' => Carbon::now()->endOfMonth()->toDateString(),
            'title' => 'Tiền thuê tháng ' . Carbon::now()->format('m/Y'),
            'type' => InvoiceType::RENT,
            'amount' => 15000000,
            'paid_amount' => 0,
            'status' => InvoiceStatus::UNPAID,
            'version' => 1,
        ], $attributes));
    }

    // ==========================================
    // 1. KIỂM THỬ DISPLAY_STATUS VÀ PHÂN LOẠI
    // ==========================================

    public function test_display_status_calculation(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        // A. Đã thanh toán (paid)
        $c1 = $this->makeContract($broker, $customer);
        $invPaid = $this->makeRentInvoice($c1, [
            'amount' => 10000000,
            'paid_amount' => 10000000,
            'due_date' => Carbon::today()->addDays(2)->toDateString(),
        ]);
        $this->assertEquals('paid', RentPaymentQuery::computeDisplayStatus($invPaid));

        // B. Quá hạn (overdue): chưa trả đủ và due_date < hôm nay
        $c2 = $this->makeContract($broker, $customer);
        $invOverdue = $this->makeRentInvoice($c2, [
            'amount' => 10000000,
            'paid_amount' => 3000000,
            'due_date' => Carbon::today()->subDay()->toDateString(),
        ]);
        $this->assertEquals('overdue', RentPaymentQuery::computeDisplayStatus($invOverdue));

        // C. Trả một phần (partial): đã trả > 0, chưa trả đủ và due_date >= hôm nay
        $c3 = $this->makeContract($broker, $customer);
        $invPartial = $this->makeRentInvoice($c3, [
            'amount' => 10000000,
            'paid_amount' => 5000000,
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
        ]);
        $this->assertEquals('partial', RentPaymentQuery::computeDisplayStatus($invPartial));

        // D. Chưa đến hạn (unpaid): chưa trả gì và due_date >= hôm nay
        $c4 = $this->makeContract($broker, $customer);
        $invUnpaid = $this->makeRentInvoice($c4, [
            'amount' => 10000000,
            'paid_amount' => 0,
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
        ]);
        $this->assertEquals('unpaid', RentPaymentQuery::computeDisplayStatus($invUnpaid));

        // E. Hóa đơn đã hủy (cancelled)
        $c5 = $this->makeContract($broker, $customer);
        $invCancelled = $this->makeRentInvoice($c5, [
            'status' => InvoiceStatus::CANCELLED,
            'amount' => 10000000,
            'paid_amount' => 0,
        ]);
        $this->assertEquals('cancelled', RentPaymentQuery::computeDisplayStatus($invCancelled));
    }

    // ==========================================
    // 2. KIỂM THỬ DANH SÁCH & BỘ LỌC
    // ==========================================

    public function test_can_list_rent_payments_with_filters_and_pagination(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5, 'nguyenvana@test.vn');
        $property = $this->makeProperty('P-101');
        $contract = $this->makeContract($broker, $customer, $property, ['contract_code' => 'HD-A101']);

        // Tạo 3 hóa đơn
        $invCurrentMonth = $this->makeRentInvoice($contract, [
            'billing_period_start' => '2026-10-01',
            'amount' => 10000000,
        ]);

        $invPrevMonth = $this->makeRentInvoice($contract, [
            'billing_period_start' => '2026-09-01',
            'due_date' => '2026-09-10',
            'amount' => 10000000,
        ]);

        $contract2 = $this->makeContract($broker, $customer, $property, ['contract_code' => 'HD-A101-CANC']);
        $invCancelled = $this->makeRentInvoice($contract2, [
            'billing_period_start' => '2026-10-01',
            'status' => InvoiceStatus::CANCELLED,
        ]);

        Sanctum::actingAs($admin);

        // A. Lọc tháng hiện tại (2026-10) -> Chỉ thấy invCurrentMonth (invCancelled bị ẩn mặc định)
        $res = $this->getJson('/api/rent-payments?month=2026-10');
        $res->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $invCurrentMonth->id);

        // B. Lọc tháng 'all' -> Thấy cả 2 hóa đơn chưa hủy
        $resAll = $this->getJson('/api/rent-payments?month=all');
        $resAll->assertStatus(200)
            ->assertJsonPath('meta.total', 2);

        // C. Tìm kiếm theo mã căn hộ 'P-101'
        $resSearch = $this->getJson('/api/rent-payments?month=all&search=P-101');
        $resSearch->assertStatus(200)
            ->assertJsonPath('meta.total', 2);

        // D. Lọc trạng thái 'cancelled' -> Thấy hóa đơn đã hủy
        $resCancelled = $this->getJson('/api/rent-payments?month=2026-10&status=cancelled');
        $resCancelled->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $invCancelled->id);
    }

    public function test_broker_sees_only_own_contracts(): void
    {
        $broker1 = $this->makeUser(2);
        $broker2 = $this->makeUser(2);
        $customer = $this->makeUser(5);

        $contract1 = $this->makeContract($broker1, $customer);
        $contract2 = $this->makeContract($broker2, $customer);

        $inv1 = $this->makeRentInvoice($contract1, ['billing_period_start' => '2026-10-01']);
        $inv2 = $this->makeRentInvoice($contract2, ['billing_period_start' => '2026-10-01']);

        // Broker 1 đăng nhập
        Sanctum::actingAs($broker1);
        $res = $this->getJson('/api/rent-payments?month=2026-10');
        $res->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $inv1->id);

        // Customer đăng nhập -> 403 Forbidden
        Sanctum::actingAs($customer);
        $resCust = $this->getJson('/api/rent-payments?month=2026-10');
        $resCust->assertStatus(403);
    }

    // ==========================================
    // 3. KIỂM THỬ THẺ THỐNG KÊ (SUMMARY)
    // ==========================================

    public function test_summary_statistics_matches_business_rules(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        $prop1 = $this->makeProperty('PROP-1');
        $prop2 = $this->makeProperty('PROP-2');
        $prop3 = $this->makeProperty('PROP-3');

        $c1 = $this->makeContract($broker, $customer, $prop1);
        $c2 = $this->makeContract($broker, $customer, $prop2);
        $c3 = $this->makeContract($broker, $customer, $prop3);

        // Hóa đơn 1 (Prop 1): 10tr, đã thanh toán đủ 10tr trong tháng 10
        $inv1 = $this->makeRentInvoice($c1, [
            'amount' => 10000000,
            'paid_amount' => 10000000,
            'billing_period_start' => '2026-10-01',
        ]);
        Transaction::create([
            'invoice_id' => $inv1->id,
            'amount' => 10000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'paid_at' => '2026-10-15 09:00:00',
            'status' => TransactionStatus::SUCCESS,
        ]);

        // Hóa đơn 2 (Prop 2): 15tr, quá hạn (due_date 2026-10-05 < 2026-10-26), chưa trả gì
        $inv2 = $this->makeRentInvoice($c2, [
            'amount' => 15000000,
            'paid_amount' => 0,
            'due_date' => '2026-10-05',
            'billing_period_start' => '2026-10-01',
        ]);

        // Hóa đơn 3 (Prop 3): 20tr, chưa đến hạn (due_date 2026-10-30), chưa trả gì
        $inv3 = $this->makeRentInvoice($c3, [
            'amount' => 20000000,
            'paid_amount' => 0,
            'due_date' => '2026-10-30',
            'billing_period_start' => '2026-10-01',
        ]);

        Sanctum::actingAs($admin);
        $res = $this->getJson('/api/rent-payments/summary?month=2026-10');

        $res->assertStatus(200)
            ->assertJsonPath('data.month', '2026-10')
            ->assertJsonPath('data.total_collected', 10000000)
            ->assertJsonPath('data.total_outstanding', 35000000) // 15tr + 20tr
            ->assertJsonPath('data.paid_units', 1) // Prop 1
            ->assertJsonPath('data.overdue_units', 1) // Prop 2
            ->assertJsonPath('data.upcoming_units', 1); // Prop 3
    }

    // ==========================================
    // 4. KIỂM THỬ GHI NHẬN THANH TOÁN (RECORD PAYMENT)
    // ==========================================

    public function test_can_record_payment_successfully(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $invoice = $this->makeRentInvoice($contract, [
            'amount' => 15000000,
            'paid_amount' => 0,
            'version' => 1,
        ]);

        Sanctum::actingAs($admin);

        $clientToken = (string) Str::uuid();

        $payload = [
            'version' => 1,
            'amount' => 15000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'paid_at' => Carbon::now()->toIso8601String(),
            'reference_code' => 'FT26298123456',
            'note' => 'Chuyển khoản tháng 10',
            'client_token' => $clientToken,
        ];

        $res = $this->postJson("/api/invoices/{$invoice->id}/payments", $payload);

        $res->assertStatus(201)
            ->assertJsonPath('message', 'Ghi nhận thanh toán thành công!')
            ->assertJsonPath('data.transaction.amount', 15000000)
            ->assertJsonPath('data.invoice.paid_amount', 15000000)
            ->assertJsonPath('data.invoice.remaining', 0)
            ->assertJsonPath('data.invoice.display_status', 'paid')
            ->assertJsonPath('data.invoice.version', 2);

        // Kiểm tra database
        $this->assertDatabaseHas('transactions', [
            'invoice_id' => $invoice->id,
            'amount' => 15000000,
            'client_token' => $clientToken,
            'status' => TransactionStatus::SUCCESS,
        ]);

        // Thử gửi lại cùng client_token (Idempotency) -> Trả về kết quả ban đầu không tạo thêm giao dịch
        $resDuplicate = $this->postJson("/api/invoices/{$invoice->id}/payments", $payload);
        $resDuplicate->assertStatus(201);
        $this->assertEquals(1, Transaction::where('invoice_id', $invoice->id)->count());
    }

    public function test_cannot_record_payment_exceeding_remaining(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $invoice = $this->makeRentInvoice($contract, [
            'amount' => 10000000,
            'paid_amount' => 8000000,
            'version' => 1,
        ]);

        Transaction::create([
            'invoice_id' => $invoice->id,
            'amount' => 8000000,
            'payment_method' => PaymentMethod::CASH,
            'status' => TransactionStatus::SUCCESS,
            'paid_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $res = $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'version' => 1,
            'amount' => 3000000, // Còn nợ 2tr, cố nộp 3tr
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => Carbon::now()->toIso8601String(),
            'client_token' => (string) Str::uuid(),
        ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_optimistic_locking_conflict_returns_409(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $invoice = $this->makeRentInvoice($contract, [
            'amount' => 10000000,
            'paid_amount' => 0,
            'version' => 2, // Phiên bản thực tế trong DB là 2
        ]);

        Sanctum::actingAs($admin);

        // Client gửi version = 1 (cũ)
        $res = $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'version' => 1,
            'amount' => 5000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => Carbon::now()->toIso8601String(),
            'client_token' => (string) Str::uuid(),
        ]);

        $res->assertStatus(409)
            ->assertJsonPath('code', 'STALE_VERSION');
    }

    public function test_duplicate_payment_suspected_returns_409(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        $invoice = $this->makeRentInvoice($contract, [
            'amount' => 15000000,
            'paid_amount' => 0,
            'version' => 1,
        ]);

        Sanctum::actingAs($admin);

        // Ghi nhận lần 1 không có mã tham chiếu
        $res1 = $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'version' => 1,
            'amount' => 5000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => Carbon::now()->toIso8601String(),
            'client_token' => (string) Str::uuid(),
        ]);
        $res1->assertStatus(201);

        // Ghi nhận lần 2 trong vòng 5 phút cùng số tiền 5tr, cùng CASH, không có mã tham chiếu -> Nghi trùng 409
        $res2 = $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'version' => 2,
            'amount' => 5000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => Carbon::now()->toIso8601String(),
            'client_token' => (string) Str::uuid(),
        ]);
        $res2->assertStatus(409)
            ->assertJsonPath('code', 'DUPLICATE_SUSPECTED');

        // Gửi lại với confirm_duplicate = true -> Thành công
        $res3 = $this->postJson("/api/invoices/{$invoice->id}/payments", [
            'version' => 2,
            'amount' => 5000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => Carbon::now()->toIso8601String(),
            'client_token' => (string) Str::uuid(),
            'confirm_duplicate' => true,
        ]);
        $res3->assertStatus(201);
    }

    public function test_meta_field_limits_endpoint(): void
    {
        $res = $this->getJson('/api/meta/field-limits');
        $res->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'search' => ['max'],
                    'month',
                    'status',
                    'sort',
                    'per_page',
                    'payment' => ['amount', 'reference_code', 'note'],
                ],
            ]);
    }
}
