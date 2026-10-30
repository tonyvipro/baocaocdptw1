<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\TransactionStatus;
use App\Models\Appointment;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\PaymentGatewayLog;
use App\Models\Property;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Gateways\MockGateway;
use App\Services\PaymentService;
use App\Services\PropertyAvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $broker;
    protected User $customer;
    protected User $otherCustomer;
    protected Property $property;
    protected Contract $contract;
    protected Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-10-28 10:00:00'));

        $this->admin = $this->makeUser(1, 'admin_pg@test.vn');
        $this->broker = $this->makeUser(2, 'broker_pg@test.vn');
        $this->customer = $this->makeUser(3, 'customer_pg@test.vn');
        $this->otherCustomer = $this->makeUser(3, 'other_cust_pg@test.vn');

        $this->property = Property::create([
            'title' => 'Căn hộ Test PG 01',
            'code' => 'PROP-PG-01',
            'address' => '123 Đường Test, Quận 1',
            'city' => 'TP.HCM',
            'district' => 'Quận 1',
            'purpose' => 'rent',
            'status' => 1, // Đang hiển thị
            'user_id' => $this->broker->id,
            'price_rent' => 15000000,
            'area' => 70,
        ]);

        $this->contract = Contract::create([
            'contract_code' => 'HD-PG-001',
            'contract_name' => 'HĐ Thuê Căn Hộ PG 01',
            'property_id' => $this->property->id,
            'broker_id' => $this->broker->id,
            'customer_id' => $this->customer->id,
            'rental_price' => 15000000,
            'deposit_amount' => 15000000,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addYear()->toDateString(),
            'status' => 1, // Đang có hiệu lực
        ]);

        $this->invoice = Invoice::create([
            'contract_id' => $this->contract->id,
            'invoice_no' => 'INV-PG-001',
            'title' => 'Tiền cọc căn hộ PG 01',
            'type' => InvoiceType::DEPOSIT,
            'amount' => 15000000,
            'paid_amount' => 0,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'status' => InvoiceStatus::UNPAID,
            'version' => 1,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeUser(int $roleId, string $email): User
    {
        if (!Role::find($roleId)) {
            Role::forceCreate(['id' => $roleId, 'name' => 'Role ' . $roleId]);
        }

        return User::create([
            'name' => 'Người dùng test ' . uniqid(),
            'email' => $email,
            'password' => bcrypt('password123'),
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    // 1. KIỂM THỬ KHỞI TẠO QR THANH TOÁN
    public function test_can_create_qr_payment_via_mock_gateway(): void
    {
        $token = (string) Str::uuid();

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
                'client_token' => $token,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gateway', 'mock')
            ->assertJsonPath('data.amount', 15000000);

        $txCode = $response->json('data.transaction_code');
        $this->assertNotEmpty($txCode);

        // Kiểm tra bản ghi trong DB
        $tx = Transaction::where('transaction_code', $txCode)->first();
        $this->assertNotNull($tx);
        $this->assertEquals(TransactionStatus::PENDING, (int) $tx->status);
        $this->assertEquals('gateway', $tx->source);
        $this->assertEquals('mock', $tx->gateway);
        $this->assertNotEmpty($tx->qr_content);
    }

    public function test_cannot_create_qr_payment_for_other_customer_invoice(): void
    {
        $response = $this->actingAs($this->otherCustomer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 5000000,
            ]);

        $response->assertStatus(403);
    }

    public function test_cannot_create_second_qr_payment_when_one_is_pending(): void
    {
        // Tạo lần 1
        $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 5000000,
            ])->assertStatus(201);

        // Tạo lần 2 khi lần 1 vẫn đang chờ -> Bị chặn 409
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 5000000,
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Hóa đơn đang có một giao dịch chờ thanh toán. Vui lòng hoàn tất hoặc hủy giao dịch đó.');
    }

    public function test_cannot_create_qr_payment_exceeding_remaining_amount(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 20000000, // Lớn hơn số nợ 15,000,000
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    // 2. KIỂM THỬ XỬ LÝ CALLBACK (IPN) & IDEMPOTENCY
    public function test_valid_mock_callback_marks_transaction_and_invoice_paid(): void
    {
        // 1. Khởi tạo đơn QR
        $createRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
            ]);
        $orderId = $createRes->json('data.gateway_order_id');
        $txCode = $createRes->json('data.transaction_code');

        // 2. Tạo chữ ký mock hợp lệ
        $mockGateway = new MockGateway();
        $txnId = 'MOCK-TXN-' . time();
        $signature = $mockGateway->generateSignature($orderId, $txnId, 15000000, 'success');

        // 3. Gọi Webhook IPN
        $ipnRes = $this->postJson('/api/payments/mock/ipn', [
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => $txnId,
            'amount' => 15000000,
            'action' => 'success',
            'signature' => $signature,
        ], ['X-Mock-Signature' => $signature]);

        $ipnRes->assertStatus(200);

        // 4. Kiểm tra trạng thái giao dịch và hóa đơn
        $tx = Transaction::where('transaction_code', $txCode)->first();
        $this->assertEquals(TransactionStatus::SUCCESS, (int) $tx->status);
        $this->assertEquals($txnId, $tx->gateway_txn_id);

        $this->invoice->refresh();
        $this->assertEquals(InvoiceStatus::PAID, (int) $this->invoice->status);
        $this->assertEquals(15000000, (float) $this->invoice->paid_amount);

        // 5. Kiểm tra log được lưu vào payment_gateway_logs
        $this->assertDatabaseHas('payment_gateway_logs', [
            'gateway' => 'mock',
            'transaction_id' => $tx->id,
            'signature_valid' => true,
        ]);
    }

    public function test_invalid_signature_callback_is_rejected(): void
    {
        $createRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
            ]);
        $orderId = $createRes->json('data.gateway_order_id');

        $response = $this->postJson('/api/payments/mock/ipn', [
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => 'TXN-FAKE',
            'amount' => 15000000,
            'action' => 'success',
            'signature' => 'invalid-signature-value',
        ], ['X-Mock-Signature' => 'invalid-signature-value']);

        $response->assertStatus(400);

        // Bản ghi giao dịch không bị thay đổi
        $this->invoice->refresh();
        $this->assertEquals(InvoiceStatus::UNPAID, (int) $this->invoice->status);
    }

    public function test_amount_mismatch_moves_transaction_to_reconciliation(): void
    {
        $createRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
            ]);
        $orderId = $createRes->json('data.gateway_order_id');
        $txCode = $createRes->json('data.transaction_code');

        $mockGateway = new MockGateway();
        $txnId = 'MOCK-TXN-MISMATCH';
        // Cổng báo số tiền 10,000,000 thay vì 15,000,000
        $signature = $mockGateway->generateSignature($orderId, $txnId, 10000000, 'success');

        $this->postJson('/api/payments/mock/ipn', [
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => $txnId,
            'amount' => 10000000,
            'action' => 'success',
            'signature' => $signature,
        ], ['X-Mock-Signature' => $signature])->assertStatus(200);

        $tx = Transaction::where('transaction_code', $txCode)->first();
        $this->assertEquals(TransactionStatus::RECONCILE, (int) $tx->status);

        // Hóa đơn KHÔNG bị đánh dấu đã thanh toán
        $this->invoice->refresh();
        $this->assertEquals(InvoiceStatus::UNPAID, (int) $this->invoice->status);
    }

    public function test_idempotent_duplicate_callback_does_not_double_pay(): void
    {
        $createRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
            ]);
        $orderId = $createRes->json('data.gateway_order_id');

        $mockGateway = new MockGateway();
        $txnId = 'MOCK-TXN-IDEMPOTENT';
        $signature = $mockGateway->generateSignature($orderId, $txnId, 15000000, 'success');

        $payload = [
            'gateway_order_id' => $orderId,
            'gateway_txn_id' => $txnId,
            'amount' => 15000000,
            'action' => 'success',
            'signature' => $signature,
        ];

        // Gửi lần 1
        $this->postJson('/api/payments/mock/ipn', $payload, ['X-Mock-Signature' => $signature])->assertStatus(200);
        $this->invoice->refresh();
        $this->assertEquals(15000000, (float) $this->invoice->paid_amount);

        // Gửi lần 2 trùng lặp
        $res2 = $this->postJson('/api/payments/mock/ipn', $payload, ['X-Mock-Signature' => $signature]);
        $res2->assertStatus(200);

        // Số tiền đã thu vẫn giữ nguyên 15,000,000 (không bị cộng dồn thành 30,000,000)
        $this->invoice->refresh();
        $this->assertEquals(15000000, (float) $this->invoice->paid_amount);
    }

    // 3. KIỂM THỬ HỦY GIAO DỊCH
    public function test_can_cancel_pending_qr_transaction(): void
    {
        $createRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/invoices/{$this->invoice->id}/payments/qr", [
                'gateway' => 'mock',
                'amount' => 15000000,
            ]);
        $txCode = $createRes->json('data.transaction_code');

        $cancelRes = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/payment-transactions/{$txCode}/cancel");

        $cancelRes->assertStatus(200);

        $tx = Transaction::where('transaction_code', $txCode)->first();
        $this->assertEquals(TransactionStatus::CANCELLED, (int) $tx->status);
    }

    // 4. KIỂM THỬ THỐNG KÊ 4 THẺ & BẢNG CÔNG NỢ (HÌNH 45)
    public function test_debt_listing_and_summary_metrics(): void
    {
        $debtsRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/payments/debts');

        $debtsRes->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id', 'invoice_no', 'title', 'type', 'type_label',
                        'amount', 'paid_amount', 'remaining_amount',
                        'display_status', 'display_status_label', 'has_pending_qr',
                        'contract', 'property', 'customer',
                    ]
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $summaryRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/payments/debts/summary?month=' . Carbon::today()->format('Y-m'));

        $summaryRes->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'month',
                    'total_collected',
                    'paid_amount',
                    'remaining_amount',
                    'overdue_count',
                    'overdue_amount',
                ]
            ]);
    }

    // 5. KIỂM THỬ PHẦN B: VÒNG ĐỜI BĐS (ẨN KHI THUÊ/MUA THÀNH CÔNG VÀ HIỂN THỊ LẠI KHI HẾT HẠN)
    public function test_property_hides_when_first_invoice_is_paid_and_reopens_when_expired(): void
    {
        $this->assertEquals(1, (int) $this->property->status); // Đang hiển thị

        // Tạo giao dịch thanh toán đủ hóa đơn cọc
        $paymentService = app(PaymentService::class);
        $paymentService->recordPayment($this->invoice, [
            'amount' => 15000000,
            'payment_method' => 'bank_transfer',
            'paid_at' => Carbon::now()->toDateTimeString(),
            'version' => $this->invoice->version,
            'client_token' => (string) Str::uuid(),
        ], 'manual', $this->admin);

        // Kiểm tra BĐS tự động chuyển sang status 2 (Đã cho thuê)
        $this->property->refresh();
        $this->assertEquals(2, (int) $this->property->status);
        $this->assertEquals('rented', $this->property->closed_reason);
        $this->assertEquals($this->contract->id, (int) $this->property->closed_contract_id);

        // Kiểm tra BĐS KHÔNG còn xuất hiện trong scope công khai
        $visibleIds = Property::publiclyVisible()->pluck('id')->toArray();
        $this->assertNotContains($this->property->id, $visibleIds);

        // Khi hợp đồng thuê kết thúc (status chuyển sang 3: Đã hết hạn / Đã thanh lý)
        $this->contract->update(['status' => 3]);
        $availService = app(PropertyAvailabilityService::class);
        $availService->syncForContract($this->contract);

        // BĐS tự động hiển thị lại (status = 1)
        $this->property->refresh();
        $this->assertEquals(1, (int) $this->property->status);
        $this->assertNull($this->property->closed_reason);
        $this->assertNull($this->property->closed_contract_id);

        $visibleIdsAfter = Property::publiclyVisible()->pluck('id')->toArray();
        $this->assertContains($this->property->id, $visibleIdsAfter);
    }
}
