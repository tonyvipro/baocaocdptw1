<?php

namespace Tests\Feature;

use App\Enums\DepositDisplayStatus;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Contract;
use App\Models\ContractDeposit;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DepositService;
use App\Services\InvoiceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DepositManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-10-30 09:00:00', 'Asia/Ho_Chi_Minh'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeUser(int $roleId, ?string $email = null): User
    {
        if (!Role::find($roleId)) {
            Role::forceCreate(['id' => $roleId, 'name' => 'Role ' . $roleId]);
        }

        return User::create([
            'name' => 'Người dùng ' . uniqid(),
            'email' => $email ?? (uniqid() . '@test.vn'),
            'phone' => '09' . rand(10000000, 99999999),
            'password' => bcrypt('password123'),
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    private function makeProperty(?string $code = null): Property
    {
        return Property::create([
            'code' => $code ?? ('PROP-' . Str::upper(Str::random(5))),
            'title' => 'Căn hộ cao cấp ' . Str::upper(Str::random(4)),
            'address' => 'Số 10 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
            'price' => 15000000,
            'price_rent' => 15000000,
            'deposit' => 30000000,
            'area' => 75,
            'status' => 1,
            'purpose' => 'rent',
        ]);
    }

    private function makeContractWithDeposit(
        User $broker,
        User $customer,
        float $depositAmount = 30000000,
        array $contractAttrs = []
    ): array {
        $property = $this->makeProperty();

        $contract = Contract::create(array_merge([
            'contract_code' => 'HD-' . Str::upper(Str::random(6)),
            'contract_name' => 'Hợp đồng thuê ' . $property->code,
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'start_date' => Carbon::today()->subMonths(2)->toDateString(),
            'end_date' => Carbon::today()->addMonths(10)->toDateString(),
            'rental_price' => 15000000,
            'deposit_amount' => $depositAmount,
            'currency' => 'VND',
            'billing_cycle' => 1,
            'status' => 1,
        ], $contractAttrs));

        $deposit = app(DepositService::class)->ensureDepositForContract($contract, $broker->id);

        return [$contract, $deposit, $property];
    }

    public function test_contract_creation_automatically_creates_deposit_and_invoice(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $property = $this->makeProperty('LM81-999');

        Sanctum::actingAs($admin);

        $res = $this->postJson('/api/contracts', [
            'contract_code' => 'HD-AUTO-DEP-01',
            'contract_name' => 'Hợp đồng thuê căn hộ LM81-999',
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addMonths(12)->toDateString(),
            'rental_price' => 20000000,
            'deposit_amount' => 40000000,
            'status' => 1,
        ]);

        $res->assertStatus(201);
        $contractId = $res->json('data.id');

        $deposit = ContractDeposit::where('contract_id', $contractId)->first();
        $this->assertNotNull($deposit);
        $this->assertEquals(40000000, (float) $deposit->required_amount);
        $this->assertNotNull($deposit->invoice_id);

        $invoice = Invoice::find($deposit->invoice_id);
        $this->assertNotNull($invoice);
        $this->assertEquals(InvoiceType::DEPOSIT, $invoice->type);
        $this->assertEquals(40000000, (float) $invoice->amount);
    }

    public function test_collect_deposit_partial_and_full_and_validate_limits(): void
    {
        Notification::fake();

        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        [$contract, $deposit, $property] = $this->makeContractWithDeposit($broker, $customer, 30000000);

        Sanctum::actingAs($broker);

        // 1. Lỗi khi số tiền <= 0
        $resZero = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 0,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ]);
        $resZero->assertStatus(422)
            ->assertJsonPath('errors.amount.0', 'Số tiền phải thu phải lớn hơn 0.');

        // 2. Lỗi khi số tiền thu vượt số còn thiếu (30tr)
        $resOver = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 35000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ]);
        $resOver->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);

        // 3. Thu đợt 1: 10.000.000 VNĐ -> Trạng thái 'partial_collected' (Thu một phần)
        $token1 = (string) Str::uuid();
        $resPart1 = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 10000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'paid_at' => '2026-10-28 10:00:00',
            'reference_code' => 'DEP-PART-01',
            'note' => 'Thu cọc đợt 1',
            'client_token' => $token1,
        ]);

        $resPart1->assertStatus(201)
            ->assertJsonPath('message', 'Ghi nhận thu/hoàn tiền cọc thành công!')
            ->assertJsonPath('data.deposit.collected_amount', 10000000)
            ->assertJsonPath('data.deposit.held_amount', 10000000)
            ->assertJsonPath('data.deposit.remaining_to_collect', 20000000)
            ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::PARTIAL_COLLECTED);

        // Gửi lại cùng client_token -> Idempotent, không tạo thêm giao dịch
        $resDupToken = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 10000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => $token1,
        ]);
        $resDupToken->assertStatus(201)
            ->assertJsonPath('data.deposit.collected_amount', 10000000);

        // 4. Thu đợt 2: 20.000.000 VNĐ còn lại -> Trạng thái 'holding' (Đang giữ), hóa đơn PAID, BĐS chuyển sang đã cho thuê (status = 2)
        $resPart2 = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 2,
            'amount' => 20000000,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => '2026-10-29 15:30:00',
            'reference_code' => 'DEP-PART-02',
            'note' => 'Thu đủ cọc đợt 2',
            'client_token' => (string) Str::uuid(),
        ]);

        $resPart2->assertStatus(201)
            ->assertJsonPath('data.deposit.collected_amount', 30000000)
            ->assertJsonPath('data.deposit.held_amount', 30000000)
            ->assertJsonPath('data.deposit.remaining_to_collect', 0)
            ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::HOLDING);

        $this->assertEquals(InvoiceStatus::PAID, Invoice::find($deposit->invoice_id)->status);
        $this->assertEquals(2, $property->fresh()->status);

        // 5. Khi đã thu đủ, cố thu thêm -> 409 INVALID_STATE
        $resAlreadyFull = $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 3,
            'amount' => 1000000,
            'payment_method' => PaymentMethod::CASH,
            'client_token' => (string) Str::uuid(),
        ]);
        $resAlreadyFull->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATE');
    }

    public function test_refund_and_deduction_rules_and_invoice_paid_amount_isolation(): void
    {
        Notification::fake();

        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        // Tạo HĐ đã kết thúc (status = 2) để đến hạn hoàn trả (refund_due)
        [$contract, $deposit] = $this->makeContractWithDeposit($broker, $customer, 30000000, [
            'status' => 2,
            'end_date' => Carbon::today()->subDays(2)->toDateString(),
        ]);

        Sanctum::actingAs($admin);

        // Thu đủ 30tr trước
        $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 30000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201)
          ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::REFUND_DUE);

        // 1. Môi giới cố tình gọi API hoàn trả -> 403 Forbidden
        Sanctum::actingAs($broker);
        $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 10000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(403);

        Sanctum::actingAs($admin);

        // 2. Hoàn vượt số đang giữ (30tr) -> 422 với đúng nguyên văn câu lỗi dòng 19 của spec
        $resExceed = $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 25000000,
            'deduction_amount' => 10000000,
            'deduction_reason' => 'Khấu trừ hư hỏng',
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ]);
        $resExceed->assertStatus(422)
            ->assertJsonPath('errors.refund_amount.0', 'Số tiền cọc hoàn trả vượt quá tổng số tiền cọc đang giữ.');

        // 3. Có khấu trừ nhưng bỏ trống lý do khấu trừ -> 422
        $resMissingReason = $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 10000000,
            'deduction_amount' => 5000000,
            'deduction_reason' => '',
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ]);
        $resMissingReason->assertStatus(422)
            ->assertJsonValidationErrors(['deduction_reason']);

        // 4. Hoàn 1 phần (10tr) + Khấu trừ 1 phần (5tr) -> còn giữ 15tr, trạng thái 'partial_refunded'
        $resPartial = $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 10000000,
            'deduction_amount' => 5000000,
            'deduction_reason' => 'Khấu trừ tiền điện nước tháng cuối và sơn lại tường',
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'reference_code' => 'REF-PART-01',
            'client_token' => (string) Str::uuid(),
        ]);

        $resPartial->assertStatus(201)
            ->assertJsonPath('message', 'Ghi nhận thu/hoàn tiền cọc thành công!')
            ->assertJsonPath('data.deposit.collected_amount', 30000000)
            ->assertJsonPath('data.deposit.refunded_amount', 10000000)
            ->assertJsonPath('data.deposit.deducted_amount', 5000000)
            ->assertJsonPath('data.deposit.held_amount', 15000000)
            ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::PARTIAL_REFUNDED);

        // QUAN TRỌNG: Kiểm tra hóa đơn deposit KHÔNG bị cộng giao dịch hoàn/khấu trừ vào paid_amount!
        $invoice = Invoice::find($deposit->invoice_id);
        app(InvoiceService::class)->syncPaymentStatus($invoice);
        $invoice->refresh();
        $this->assertEquals(30000000, (float) $invoice->paid_amount);
        $this->assertEquals(InvoiceStatus::PAID, $invoice->status);

        // 5. Hoàn nốt 15tr còn lại -> held = 0, trạng thái 'refunded'
        $resFull = $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 3,
            'refund_amount' => 15000000,
            'deduction_amount' => 0,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'reference_code' => 'REF-FULL-02',
            'client_token' => (string) Str::uuid(),
        ]);

        $resFull->assertStatus(201)
            ->assertJsonPath('data.deposit.held_amount', 0)
            ->assertJsonPath('data.deposit.refunded_amount', 25000000)
            ->assertJsonPath('data.deposit.deducted_amount', 5000000)
            ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::REFUNDED);

        // 6. Hủy (void) giao dịch hoàn 15tr vừa thực hiện -> held quay về 15tr
        $lastRefundTx = Transaction::where('invoice_id', $deposit->invoice_id)
            ->where('type', TransactionType::DEPOSIT_REFUND)
            ->where('amount', 15000000)
            ->firstOrFail();

        $resVoid = $this->postJson("/api/deposit-movements/{$lastRefundTx->id}/void", [
            'reason' => 'Kế toán nhập nhầm tài khoản thụ hưởng, hủy để nhập lại.',
        ]);

        $resVoid->assertStatus(200)
            ->assertJsonPath('data.held_amount', 15000000)
            ->assertJsonPath('data.refunded_amount', 10000000)
            ->assertJsonPath('data.display_status', DepositDisplayStatus::PARTIAL_REFUNDED);
    }

    public function test_early_refund_on_active_contract_requires_reason(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        // Hợp đồng đang hiệu lực (status = 1, end_date còn 10 tháng nữa)
        [$contract, $deposit] = $this->makeContractWithDeposit($broker, $customer, 20000000, [
            'status' => 1,
            'end_date' => Carbon::today()->addMonths(10)->toDateString(),
        ]);

        Sanctum::actingAs($admin);

        // Thu đủ 20tr
        $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 1,
            'amount' => 20000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);

        // Hoàn sớm không nhập lý do -> 422
        $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 20000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'note' => '',
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['note']);

        // Hoàn sớm có nhập lý do -> 201 Thành công
        $this->postJson("/api/deposits/{$deposit->id}/refund", [
            'version' => 2,
            'refund_amount' => 20000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'note' => 'Hai bên thỏa thuận chấm dứt hợp đồng sớm và hoàn trả tiền cọc.',
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201)
          ->assertJsonPath('data.deposit.held_amount', 0)
          ->assertJsonPath('data.deposit.display_status', DepositDisplayStatus::REFUNDED);
    }

    public function test_update_deposit_locks_required_amount_after_collection(): void
    {
        $admin = $this->makeUser(1);
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);

        [$contract, $deposit] = $this->makeContractWithDeposit($broker, $customer, 20000000);

        Sanctum::actingAs($admin);

        // 1. Khi chưa thu (collected = 0): sửa required_amount sang 25tr thành công và đồng bộ sang HĐ + Hóa đơn
        $resEdit1 = $this->patchJson("/api/deposits/{$deposit->id}", [
            'version' => 1,
            'required_amount' => 25000000,
            'notes' => 'Điều chỉnh mức cọc theo phụ lục',
        ]);

        $resEdit1->assertStatus(200)
            ->assertJsonPath('data.required_amount', 25000000)
            ->assertJsonPath('data.version', 2);

        $this->assertEquals(25000000, (float) $contract->fresh()->deposit_amount);
        $this->assertEquals(25000000, (float) Invoice::find($deposit->invoice_id)->amount);

        // 2. Thu 1 phần (10tr)
        $this->postJson("/api/deposits/{$deposit->id}/collect", [
            'version' => 2,
            'amount' => 10000000,
            'payment_method' => PaymentMethod::CASH,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);

        // 3. Cố sửa required_amount sau khi đã thu -> 409 INVALID_STATE
        $resEditLocked = $this->patchJson("/api/deposits/{$deposit->id}", [
            'version' => 3,
            'required_amount' => 30000000,
        ]);
        $resEditLocked->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATE');

        // 4. Nhưng sửa ghi chú (notes) và hạn hoàn trả dự kiến (refund_due_date) vẫn thành công
        $resEditNote = $this->patchJson("/api/deposits/{$deposit->id}", [
            'version' => 3,
            'notes' => 'Khách hẹn cuối tuần đóng nốt 15tr',
        ]);
        $resEditNote->assertStatus(200)
            ->assertJsonPath('data.notes', 'Khách hẹn cuối tuần đóng nốt 15tr');
    }

    public function test_summary_cards_match_filtered_table_rows_and_policy_isolation(): void
    {
        $admin = $this->makeUser(1);
        $broker1 = $this->makeUser(2);
        $broker2 = $this->makeUser(2);
        $customer1 = $this->makeUser(5);
        $customer2 = $this->makeUser(5);

        // Tạo 4 khoản cọc:
        // (1) Broker 1: Chưa thu (unpaid) - 20tr
        [, $depUnpaid] = $this->makeContractWithDeposit($broker1, $customer1, 20000000);

        // (2) Broker 1: Đang giữ (holding) - 30tr
        [, $depHolding] = $this->makeContractWithDeposit($broker1, $customer1, 30000000);
        Sanctum::actingAs($admin);
        $this->postJson("/api/deposits/{$depHolding->id}/collect", [
            'version' => 1,
            'amount' => 30000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);

        // (3) Broker 1: Cần hoàn trả (refund_due) - 40tr, HĐ đã hết hạn
        [, $depRefundDue] = $this->makeContractWithDeposit($broker1, $customer1, 40000000, [
            'status' => 2,
            'end_date' => Carbon::today()->subDays(5)->toDateString(),
        ]);
        $this->postJson("/api/deposits/{$depRefundDue->id}/collect", [
            'version' => 1,
            'amount' => 40000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);

        // (4) Broker 2: Đã hoàn trả (refunded) - 15tr
        [, $depRefunded] = $this->makeContractWithDeposit($broker2, $customer2, 15000000, [
            'status' => 2,
            'end_date' => Carbon::today()->subDays(10)->toDateString(),
        ]);
        $this->postJson("/api/deposits/{$depRefunded->id}/collect", [
            'version' => 1,
            'amount' => 15000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);
        $this->postJson("/api/deposits/{$depRefunded->id}/refund", [
            'version' => 2,
            'refund_amount' => 15000000,
            'payment_method' => PaymentMethod::BANK_TRANSFER,
            'client_token' => (string) Str::uuid(),
        ])->assertStatus(201);

        // Kiểm tra Thẻ thống kê dưới quyền Admin (thấy cả 4 khoản)
        $summaryRes = $this->getJson('/api/deposits/summary')->assertStatus(200);
        $summary = $summaryRes->json('data');

        $this->assertEquals(70000000, $summary['total_held_amount']); // 30tr + 40tr
        $this->assertEquals(3, $summary['collected_count']);          // depHolding, depRefundDue, depRefunded
        $this->assertEquals(2, $summary['holding_count']);            // depHolding, depRefundDue (held > 0)
        $this->assertEquals(1, $summary['refund_due_count']);         // depRefundDue

        // Bấm thẻ "Đã thu" (status=collected_any) -> số dòng = collected_count = 3
        $this->getJson('/api/deposits?status=collected_any')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', $summary['collected_count']);

        // Bấm thẻ "Đang giữ" (status=held_any) -> số dòng = holding_count = 2
        $this->getJson('/api/deposits?status=held_any')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', $summary['holding_count']);

        // Bấm thẻ "Cần hoàn trả" (status=refund_due) -> số dòng = refund_due_count = 1
        $this->getJson('/api/deposits?status=refund_due')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', $summary['refund_due_count']);

        // Kiểm tra phân quyền Broker 2: chỉ thấy 1 khoản của mình
        Sanctum::actingAs($broker2);
        $this->getJson('/api/deposits')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1);

        // Kiểm tra Khách hàng 1: bị chặn 403 ở /api/deposits, nhưng xem được qua /api/my-deposits
        Sanctum::actingAs($customer1);
        $this->getJson('/api/deposits')->assertStatus(403);
        $this->getJson('/api/my-deposits')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_backfill_and_notify_due_commands_are_idempotent(): void
    {
        $broker = $this->makeUser(2);
        $customer = $this->makeUser(5);
        $property = $this->makeProperty();

        // Tạo hợp đồng trực tiếp bằng Eloquent không qua DepositService để giả lập dữ liệu cũ
        $contract = Contract::create([
            'contract_code' => 'HD-OLD-001',
            'contract_name' => 'Hợp đồng cũ cần backfill',
            'property_id' => $property->id,
            'broker_id' => $broker->id,
            'customer_id' => $customer->id,
            'start_date' => Carbon::today()->subMonths(6)->toDateString(),
            'end_date' => Carbon::today()->subDays(1)->toDateString(),
            'rental_price' => 12000000,
            'deposit_amount' => 24000000,
            'status' => 2,
        ]);

        // Chạy backfill lần 1 và lần 2 -> chỉ tạo đúng 1 bản ghi contract_deposits
        $this->artisan('deposits:backfill')->assertSuccessful();
        $this->artisan('deposits:backfill')->assertSuccessful();

        $this->assertEquals(1, ContractDeposit::where('contract_id', $contract->id)->count());

        // Chạy lệnh nhắc hạn hoàn cọc 2 lần trong ngày -> idempotent
        $this->artisan('deposits:notify-due')->assertSuccessful();
        $this->artisan('deposits:notify-due')->assertSuccessful();
    }
}

