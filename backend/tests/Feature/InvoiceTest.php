<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Transaction;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Services\InvoiceService;
use App\Mail\InvoiceMailable;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(int $roleId = 2): User
    {
        if (!Role::find($roleId)) {
            Role::forceCreate(['id' => $roleId, 'name' => 'Role ' . $roleId]);
        }

        return User::create([
            'name' => 'Người dùng test ' . uniqid(),
            'email' => uniqid() . '@example.com',
            'password' => 'secret123',
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    private function makeContract(User $broker, User $customer, array $attributes = []): Contract
    {
        $property = Property::create([
            'code' => 'A101-' . strtoupper(uniqid()),
            'title' => 'Căn hộ Landmark A101',
            'price' => 15000000,
            'price_rent' => 15000000,
            'area' => 75,
            'status' => 1,
            'type' => 'Căn hộ chung cư',
        ]);

        return Contract::create(array_merge([
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'contract_code' => 'HD-' . strtoupper(uniqid()),
            'contract_name' => 'Hợp đồng thuê căn hộ Landmark A101',
            'start_date' => Carbon::now()->subMonths(6)->toDateString(),
            'end_date' => Carbon::now()->addMonths(6)->toDateString(),
            'rental_price' => 15000000,
            'deposit_amount' => 30000000,
            'billing_cycle' => 1,
            'next_billing_date' => Carbon::today()->toDateString(),
            'currency' => 'VND',
            'status' => 1, // Đang có hiệu lực
        ], $attributes));
    }

    public function test_can_create_invoice_manually_and_calculate_amount_on_backend(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $payload = [
            'contract_id' => $contract->id,
            'type' => 'service',
            'title' => 'Phí dịch vụ & điện nước tháng này',
            'due_date' => Carbon::today()->addDays(10)->toDateString(),
            'note' => 'Ghi chú kiểm thử',
            'amount' => 999999999, // Tiền client gửi sẽ bị bỏ qua
            'items' => [
                [
                    'item_name' => 'Phí quản lý',
                    'quantity' => 1,
                    'unit_price' => 500000,
                    'description' => '1 tháng',
                ],
                [
                    'item_name' => 'Tiền điện',
                    'quantity' => 100,
                    'unit_price' => 3500,
                    'description' => '100 kWh x 3.500đ',
                ],
            ],
        ];

        $response = $this->postJson('/api/invoices', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Lập hóa đơn thanh toán thành công!')
            ->assertJsonPath('data.amount', 850000) // 500.000 + 350.000 = 850.000
            ->assertJsonPath('data.paid_amount', 0)
            ->assertJsonPath('data.remaining', 850000)
            ->assertJsonPath('data.status', 0);

        $invoiceNo = $response->json('data.invoice_no');
        $this->assertStringStartsWith('QLTT-INV-', $invoiceNo);
        $this->assertStringContainsString('A101', $invoiceNo);
    }

    public function test_cannot_create_invoice_for_invalid_contract(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer, ['status' => 0]); // Status 0 = Nháp

        Sanctum::actingAs($admin);

        $payload = [
            'contract_id' => $contract->id,
            'type' => 'service',
            'title' => 'Test hóa đơn',
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'items' => [
                ['item_name' => 'Phí dịch vụ', 'quantity' => 1, 'unit_price' => 200000],
            ],
        ];

        $response = $this->postJson('/api/invoices', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['contract_id']);
    }

    public function test_cannot_create_duplicate_rent_invoice_for_same_period(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $periodStart = Carbon::today()->startOfMonth()->toDateString();
        $periodEnd = Carbon::today()->endOfMonth()->toDateString();

        $payload = [
            'contract_id' => $contract->id,
            'type' => 'rent',
            'title' => 'Tiền thuê tháng này',
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'billing_period_start' => $periodStart,
            'billing_period_end' => $periodEnd,
            'items' => [
                ['item_name' => 'Tiền nhà', 'quantity' => 1, 'unit_price' => 15000000],
            ],
        ];

        // Lần 1: Thành công
        $res1 = $this->postJson('/api/invoices', $payload);
        $res1->assertStatus(201);

        // Lần 2: Trùng kỳ -> 409 Conflict
        $res2 = $this->postJson('/api/invoices', $payload);
        $res2->assertStatus(409)
            ->assertJsonPath('message', 'Hóa đơn tiền thuê cho kỳ này đã tồn tại trong hệ thống.');
    }

    public function test_can_update_invoice_when_unpaid_and_no_transactions(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-202610-A101-99',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(10)->toDateString(),
            'title' => 'Tiêu đề cũ',
            'type' => 'service',
            'amount' => 500000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);
        $invoice->items()->create([
            'item_name' => 'Phí cũ',
            'quantity' => 1,
            'unit_price' => 500000,
            'total_price' => 500000,
        ]);

        $updatePayload = [
            'title' => 'Tiêu đề mới sau khi sửa',
            'items' => [
                ['item_name' => 'Phí mới 1', 'quantity' => 1, 'unit_price' => 300000],
                ['item_name' => 'Phí mới 2', 'quantity' => 2, 'unit_price' => 200000],
            ],
        ];

        $response = $this->putJson("/api/invoices/{$invoice->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Cập nhật hóa đơn thành công!')
            ->assertJsonPath('data.title', 'Tiêu đề mới sau khi sửa')
            ->assertJsonPath('data.amount', 700000); // 300k + 400k = 700k
    }

    public function test_cannot_update_items_when_invoice_has_transactions(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-202610-A101-88',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(10)->toDateString(),
            'title' => 'Hóa đơn đã có giao dịch',
            'type' => 'service',
            'amount' => 1000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 500000,
        ]);
        Transaction::create([
            'invoice_id' => $invoice->id,
            'amount' => 500000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'paid_at' => now(),
        ]);

        $response = $this->putJson("/api/invoices/{$invoice->id}", [
            'items' => [
                ['item_name' => 'Cố tình sửa hạng mục', 'quantity' => 1, 'unit_price' => 500000],
            ],
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Hóa đơn đã phát sinh giao dịch thanh toán, không thể chỉnh sửa số tiền và hạng mục.');
    }

    public function test_can_cancel_unpaid_invoice_with_reason(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-202610-A101-77',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(10)->toDateString(),
            'title' => 'Hóa đơn cần hủy',
            'type' => 'other',
            'amount' => 500000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        $response = $this->postJson("/api/invoices/{$invoice->id}/cancel", [
            'cancel_reason' => 'Khách hàng không sử dụng dịch vụ phụ này nữa.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Hủy hóa đơn thành công!')
            ->assertJsonPath('data.status', 3)
            ->assertJsonPath('data.cancel_reason', 'Khách hàng không sử dụng dịch vụ phụ này nữa.');
    }

    public function test_sync_payment_status_is_idempotent(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);
        $service = app(InvoiceService::class);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-SYNC-01',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->subDays(5)->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn test sync status',
            'type' => 'rent',
            'amount' => 10000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        // 1. Chưa trả gì, chưa quá hạn -> status = 0
        $service->syncPaymentStatus($invoice);
        $this->assertEquals(0, $invoice->fresh()->status);
        $this->assertEquals(0, $invoice->fresh()->paid_amount);

        // 2. Trả 1 phần (4tr), chưa quá hạn -> status = 0, paid_amount = 4tr
        Transaction::create([
            'invoice_id' => $invoice->id,
            'amount' => 4000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'paid_at' => now(),
        ]);
        $service->syncPaymentStatus($invoice);
        $this->assertEquals(0, $invoice->fresh()->status);
        $this->assertEquals(4000000, $invoice->fresh()->paid_amount);

        // 3. Đổi due_date về quá khứ -> status = 2 (Overdue)
        $invoice->due_date = Carbon::today()->subDays(1)->toDateString();
        $invoice->save();
        $service->syncPaymentStatus($invoice);
        $this->assertEquals(2, $invoice->fresh()->status);

        // 4. Trả đủ 6tr còn lại -> status = 1 (Paid)
        Transaction::create([
            'invoice_id' => $invoice->id,
            'amount' => 6000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => now(),
        ]);
        $service->syncPaymentStatus($invoice);
        $this->assertEquals(1, $invoice->fresh()->status);
        $this->assertEquals(10000000, $invoice->fresh()->paid_amount);
        $this->assertNotNull($invoice->fresh()->paid_at);

        // 5. Chạy lại lần nữa để kiểm tra idempotency -> vẫn giữ nguyên status = 1
        $service->syncPaymentStatus($invoice);
        $this->assertEquals(1, $invoice->fresh()->status);
    }

    public function test_cron_generate_rent_invoices(): void
    {
        Notification::fake();

        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer, [
            'next_billing_date' => Carbon::today()->toDateString(),
            'billing_cycle' => 1,
            'rental_price' => 15000000,
        ]);

        // Chạy lần 1
        $this->artisan('invoices:generate-rent')->assertSuccessful();

        $invoice = Invoice::where('contract_id', $contract->id)->where('type', 'rent')->first();
        $this->assertNotNull($invoice);
        $this->assertEquals(15000000, $invoice->amount);
        $this->assertEquals(Carbon::today()->toDateString(), $invoice->billing_period_start->toDateString());

        // next_billing_date đã được đẩy lên tháng sau
        $nextDate = Carbon::today()->addMonthNoOverflow()->toDateString();
        $this->assertEquals($nextDate, $contract->fresh()->next_billing_date->toDateString());

        // Chạy lần 2 không sinh trùng
        $countBefore = Invoice::count();
        $this->artisan('invoices:generate-rent')->assertSuccessful();
        $this->assertEquals($countBefore, Invoice::count());
    }

    public function test_cron_mark_overdue_invoices(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        // Hóa đơn chưa trả quá hạn
        $overdueInvoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-OD-01',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->subDays(20)->toDateString(),
            'due_date' => Carbon::today()->subDays(5)->toDateString(),
            'title' => 'Hóa đơn test quá hạn',
            'type' => 'service',
            'amount' => 1000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        $this->artisan('invoices:mark-overdue')->assertSuccessful();

        $this->assertEquals(2, $overdueInvoice->fresh()->status);
    }

    public function test_send_invoice_email_success_and_rate_limiting(): void
    {
        Mail::fake();

        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-MAIL-01',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn gửi mail',
            'type' => 'rent',
            'amount' => 15000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        // Lần 1: Gửi thành công
        $res1 = $this->postJson("/api/invoices/{$invoice->id}/send-email");
        $res1->assertStatus(200)
            ->assertJsonPath('message', 'Đã gửi hóa đơn thanh toán đến email của khách hàng!');

        Mail::assertSent(InvoiceMailable::class, function ($mail) use ($customer) {
            return $mail->hasTo($customer->email);
        });

        // Lần 2 ngay lập tức: Bị rate limit 1 phút (429)
        $res2 = $this->postJson("/api/invoices/{$invoice->id}/send-email");
        $res2->assertStatus(429);
    }

    public function test_download_pdf_returns_valid_pdf_response(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-PDF-01',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn xuất PDF',
            'type' => 'rent',
            'amount' => 15000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);
        $invoice->items()->create([
            'item_name' => 'Tiền thuê',
            'quantity' => 1,
            'unit_price' => 15000000,
            'total_price' => 15000000,
        ]);

        $res = $this->get("/api/invoices/{$invoice->id}/pdf?download=1");
        $res->assertStatus(200);
        $this->assertEquals('application/pdf', $res->headers->get('content-type'));
        $this->assertStringContainsString('QLTT-INV-PDF-01.pdf', $res->headers->get('content-disposition'));
    }

    public function test_send_invoice_email_fails_when_no_valid_email(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $customer->email = '';
        $customer->saveQuietly();

        $contract = $this->makeContract($broker, $customer);

        Sanctum::actingAs($admin);

        $invoice = Invoice::create([
            'invoice_no' => 'QLTT-INV-MAIL-FAIL',
            'contract_id' => $contract->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn thiếu email',
            'type' => 'rent',
            'amount' => 15000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        $res = $this->postJson("/api/invoices/{$invoice->id}/send-email", ['email' => '']);
        $res->assertStatus(422)
            ->assertJsonPath('message', 'Không thể gửi email: Địa chỉ email khách hàng không tồn tại hoặc lỗi máy chủ SMTP.');
    }

    public function test_customer_portal_policy_isolation(): void
    {
        $broker = $this->makeUser(2);
        $customer1 = $this->makeUser(5);
        $customer2 = $this->makeUser(5);

        $contract1 = $this->makeContract($broker, $customer1);
        $contract2 = $this->makeContract($broker, $customer2);

        $inv1 = Invoice::create([
            'invoice_no' => 'QLTT-INV-C1',
            'contract_id' => $contract1->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn khách 1',
            'type' => 'rent',
            'amount' => 10000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        $inv1Cancelled = Invoice::create([
            'invoice_no' => 'QLTT-INV-C1-CAN',
            'contract_id' => $contract1->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn hủy của khách 1',
            'type' => 'rent',
            'amount' => 10000000,
            'status' => InvoiceStatus::CANCELLED,
            'paid_amount' => 0,
        ]);

        $inv2 = Invoice::create([
            'invoice_no' => 'QLTT-INV-C2',
            'contract_id' => $contract2->id,
            'issue_date' => Carbon::today()->toDateString(),
            'due_date' => Carbon::today()->addDays(5)->toDateString(),
            'title' => 'Hóa đơn khách 2',
            'type' => 'rent',
            'amount' => 10000000,
            'status' => InvoiceStatus::UNPAID,
            'paid_amount' => 0,
        ]);

        // Customer 1 đăng nhập
        Sanctum::actingAs($customer1);

        // Danh sách của Customer 1: chỉ thấy inv1, KHÔNG thấy inv1Cancelled, KHÔNG thấy inv2
        $res = $this->getJson('/api/my/invoices');
        $res->assertStatus(200);
        $ids = collect($res->json('data'))->pluck('id')->all();
        $this->assertContains($inv1->id, $ids);
        $this->assertNotContains($inv1Cancelled->id, $ids);
        $this->assertNotContains($inv2->id, $ids);

        // Xem trực tiếp inv2 của người khác -> 403 Forbidden
        $resOther = $this->getJson("/api/my/invoices/{$inv2->id}");
        $resOther->assertStatus(403);
    }
}
