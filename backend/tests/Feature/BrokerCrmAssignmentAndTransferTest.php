<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Broker;
use App\Models\BrokerAssignment;
use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\CustomerInteraction;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BrokerCrmAssignmentAndTransferTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (Role::cases() as $role) {
            \App\Models\Role::firstOrCreate(['id' => $role->value], [
                'name' => $role->name,
                'description' => $role->description(),
            ]);
        }
    }

    private function makeUser(Role $role, string $email, bool $active = true): User
    {
        return User::create([
            'name' => 'User ' . $role->name . ' ' . uniqid(),
            'email' => $email,
            'password' => Hash::make('Password123!'),
            'role_id' => $role->value,
            'is_active' => $active,
        ]);
    }

    private function makeBroker(string $name, string $code, ?User $user = null, string $status = 'active'): Broker
    {
        return Broker::create([
            'name' => $name,
            'code' => $code,
            'email' => $user ? $user->email : "{$code}@test.vn",
            'phone' => '0912345678',
            'level' => 'Chuyên viên',
            'status' => $status,
            'user_id' => $user?->id,
            'deals_count' => 0,
            'total_commission' => 0,
        ]);
    }

    private function makeCustomer(string $name, ?Broker $primaryBroker = null): Customer
    {
        return Customer::create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '', $name)) . '@gmail.com',
            'phone' => '0987654321',
            'customer_group' => 'potential',
            'status' => 'new',
            'primary_broker_id' => $primaryBroker?->id,
            'assigned_to' => $primaryBroker?->user_id,
        ]);
    }

    private function makeDemand(Customer $customer): CustomerDemand
    {
        $type = PropertyType::firstOrCreate(['slug' => 'can-ho'], [
            'name' => 'Căn hộ chung cư',
            'status' => 1,
        ]);

        return CustomerDemand::create([
            'customer_id' => $customer->id,
            'property_type_id' => $type->id,
            'budget_min' => 2000000000,
            'budget_max' => 5000000000,
            'area' => '100',
            'status' => 'processing',
            'notes' => 'Cần mua căn hộ 2 phòng ngủ',
        ]);
    }

    /**
     * 1. Test phân công liên kết khách hàng & nhu cầu, phân biệt is_primary
     */
    public function test_assignment_links_to_customer_and_requirement_and_distinguishes_primary_broker(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_crm@test.vn');
        $brokerUser1 = $this->makeUser(Role::Broker, 'broker1@test.vn');
        $brokerUser2 = $this->makeUser(Role::Broker, 'broker2@test.vn');

        $primaryBroker = $this->makeBroker('Môi giới Phụ trách chính', 'MG-PRI-01', $brokerUser1);
        $handlingBroker = $this->makeBroker('Môi giới Xử lý nhu cầu', 'MG-SEC-01', $brokerUser2);

        $customer = $this->makeCustomer('Nguyễn Khách Hàng VIP', $primaryBroker);
        $demand = $this->makeDemand($customer);

        // A. Tạo phân công giao cho môi giới xử lý yêu cầu (khác người phụ trách chính)
        $resHandling = $this->actingAs($admin, 'sanctum')->postJson('/api/broker-assignments', [
            'customer_id' => $customer->id,
            'requirement_id' => $demand->id,
            'broker_id' => $handlingBroker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
            'notes' => 'Giao xử lý nhu cầu tìm căn hộ',
        ]);

        $resHandling->assertCreated();
        $assignmentHandlingId = $resHandling->json('data.id');
        $this->assertEquals($customer->id, $resHandling->json('data.customer_id'));
        $this->assertEquals($demand->id, $resHandling->json('data.requirement_id'));
        $this->assertFalse($resHandling->json('data.is_primary'), 'Môi giới xử lý yêu cầu không phải người phụ trách chính thì is_primary = false');

        // B. Tạo phân công giao cho chính người phụ trách chính
        $resPrimary = $this->actingAs($admin, 'sanctum')->postJson('/api/broker-assignments', [
            'customer_id' => $customer->id,
            'requirement_id' => $demand->id,
            'broker_id' => $primaryBroker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
            'notes' => 'Người phụ trách chính trực tiếp xử lý',
        ]);

        $resPrimary->assertCreated();
        $this->assertTrue($resPrimary->json('data.is_primary'), 'Môi giới trùng người phụ trách chính thì is_primary = true');

        // C. Kiểm tra ActivityLog và CustomerInteraction đã được ghi nhận
        $this->assertDatabaseHas('activity_logs', [
            'table_name' => 'broker_assignments',
            'record_id' => $assignmentHandlingId,
            'action' => 'ASSIGNMENT_CREATED',
        ]);

        $this->assertDatabaseHas('customer_interactions', [
            'customer_id' => $customer->id,
            'type' => 'note',
        ]);
    }

    /**
     * 2. Test API điều chuyển phân công chặn môi giới tạm ngưng, chưa có tài khoản, hoặc tài khoản bị khóa
     */
    public function test_transfer_assignment_blocks_suspended_or_unlinked_broker(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_transfer@test.vn');
        $brokerUserActive = $this->makeUser(Role::Broker, 'broker_act@test.vn');
        $brokerUserLocked = $this->makeUser(Role::Broker, 'broker_locked@test.vn', false);

        $brokerCurrent = $this->makeBroker('Môi giới Hiện tại', 'MG-CUR-01', $brokerUserActive);
        $brokerSuspended = $this->makeBroker('Môi giới Tạm ngưng', 'MG-SUS-01', $this->makeUser(Role::Broker, 'broker_sus@test.vn'), 'inactive');
        $brokerNoAccount = $this->makeBroker('Môi giới Chưa có tài khoản', 'MG-NOACC-01', null);
        $brokerLocked = $this->makeBroker('Môi giới Tài khoản khóa', 'MG-LCK-01', $brokerUserLocked);

        $customer = $this->makeCustomer('Khách Hàng Test', $brokerCurrent);
        $assignment = BrokerAssignment::create([
            'request_code' => 'YC-2026-991',
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'property_location' => 'Quận 1, TP.HCM',
            'broker_id' => $brokerCurrent->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
        ]);

        // A. Chuyển cho môi giới tạm ngưng -> 422
        $resSuspended = $this->actingAs($admin, 'sanctum')->postJson("/api/broker-assignments/{$assignment->id}/transfer", [
            'version' => 1,
            'target_broker_id' => $brokerSuspended->id,
            'reason' => 'Chuyển việc do bận',
        ]);
        $resSuspended->assertStatus(422);
        $this->assertStringContainsString('tạm ngưng', $resSuspended->json('errors.target_broker_id.0'));

        // B. Chuyển cho môi giới chưa liên kết tài khoản -> 422
        $resNoAcc = $this->actingAs($admin, 'sanctum')->postJson("/api/broker-assignments/{$assignment->id}/transfer", [
            'version' => 1,
            'target_broker_id' => $brokerNoAccount->id,
            'reason' => 'Chuyển việc',
        ]);
        $resNoAcc->assertStatus(422);
        $this->assertStringContainsString('chưa liên kết tài khoản', $resNoAcc->json('errors.target_broker_id.0'));

        // C. Chuyển cho môi giới có tài khoản bị khóa -> 422
        $resLocked = $this->actingAs($admin, 'sanctum')->postJson("/api/broker-assignments/{$assignment->id}/transfer", [
            'version' => 1,
            'target_broker_id' => $brokerLocked->id,
            'reason' => 'Chuyển việc',
        ]);
        $resLocked->assertStatus(422);
        $this->assertStringContainsString('đang bị khóa', $resLocked->json('errors.target_broker_id.0'));

        // D. Chuyển cho chính môi giới đang phụ trách -> 422
        $resSame = $this->actingAs($admin, 'sanctum')->postJson("/api/broker-assignments/{$assignment->id}/transfer", [
            'version' => 1,
            'target_broker_id' => $brokerCurrent->id,
            'reason' => 'Chuyển cho chính mình',
        ]);
        $resSame->assertStatus(422);
        $this->assertStringContainsString('khác', $resSame->json('errors.target_broker_id.0'));
    }

    /**
     * 3. Test điều chuyển phân công thành công và ghi nhận nhật ký đầy đủ
     */
    public function test_transfer_assignment_succeeds_and_writes_logs_after_commit(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_success@test.vn');
        $brokerUser1 = $this->makeUser(Role::Broker, 'broker_from@test.vn');
        $brokerUser2 = $this->makeUser(Role::Broker, 'broker_to@test.vn');

        $brokerFrom = $this->makeBroker('Môi giới Chuyển đi', 'MG-FROM-01', $brokerUser1);
        $brokerTo = $this->makeBroker('Môi giới Nhận việc', 'MG-TO-01', $brokerUser2);

        $customer = $this->makeCustomer('Khách Cần Chăm Sóc', $brokerFrom);
        $assignment = BrokerAssignment::create([
            'request_code' => 'YC-2026-992',
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'property_location' => 'Quận Bình Thạnh',
            'broker_id' => $brokerFrom->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
            'notes' => 'Yêu cầu xem nhà gấp',
        ]);

        $res = $this->actingAs($admin, 'sanctum')->postJson("/api/broker-assignments/{$assignment->id}/transfer", [
            'version' => 1,
            'target_broker_id' => $brokerTo->id,
            'reason' => 'Môi giới cũ đi công tác đột xuất',
        ]);

        $res->assertOk();
        $this->assertEquals($brokerTo->id, $res->json('data.broker_id'));

        // Kiểm tra database
        $assignment->refresh();
        $this->assertEquals($brokerTo->id, $assignment->broker_id);
        $this->assertStringContainsString('Môi giới Chuyển đi', $assignment->notes);
        $this->assertStringContainsString('Môi giới Nhận việc', $assignment->notes);
        $this->assertStringContainsString('công tác đột xuất', $assignment->notes);

        // Kiểm tra ActivityLog
        $log = ActivityLog::where('table_name', 'broker_assignments')
            ->where('record_id', $assignment->id)
            ->where('action', 'ASSIGNMENT_TRANSFERRED')
            ->first();

        $this->assertNotNull($log, 'Nhật ký ActivityLog phải được ghi nhận');
        $this->assertEquals($admin->id, $log->user_id);
        $this->assertEquals($brokerFrom->id, $log->old_data['broker_id']);
        $this->assertEquals($brokerTo->id, $log->new_data['broker_id']);
        $this->assertEquals('Môi giới cũ đi công tác đột xuất', $log->new_data['reason']);

        // Kiểm tra CustomerInteraction
        $interaction = CustomerInteraction::where('customer_id', $customer->id)
            ->where('summary', 'like', '%Điều chuyển phân công%')
            ->first();

        $this->assertNotNull($interaction, 'Phải ghi nhận tương tác chăm sóc khách hàng');
        $this->assertStringContainsString('YC-2026-992', $interaction->summary);
        $this->assertStringContainsString('Môi giới Chuyển đi', $interaction->summary);
        $this->assertStringContainsString('Môi giới Nhận việc', $interaction->summary);
    }

    /**
     * 4. Test điều chuyển người phụ trách chính của khách hàng (customers.primary_broker_id)
     */
    public function test_transfer_customer_primary_broker_validations_and_success(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_cust_transfer@test.vn');
        $brokerUser1 = $this->makeUser(Role::Broker, 'broker_p1@test.vn');
        $brokerUser2 = $this->makeUser(Role::Broker, 'broker_p2@test.vn');

        $primaryBroker1 = $this->makeBroker('Người Phụ Trách Cũ', 'MG-OLD-01', $brokerUser1);
        $primaryBroker2 = $this->makeBroker('Người Phụ Trách Mới', 'MG-NEW-01', $brokerUser2);
        $suspendedBroker = $this->makeBroker('Người Tạm Ngưng', 'MG-SUSP-02', $this->makeUser(Role::Broker, 'sus@test.vn'), 'inactive');

        $customer = $this->makeCustomer('Doanh nghiệp Địa ốc ACB', $primaryBroker1);

        // A. Chuyển sang broker tạm ngưng -> 422
        $resSuspended = $this->actingAs($admin, 'sanctum')->postJson("/api/customers/{$customer->id}/transfer-broker", [
            'target_broker_id' => $suspendedBroker->id,
            'reason' => 'Đổi người chăm sóc',
        ]);
        $resSuspended->assertStatus(422);

        // B. Chuyển cho chính broker hiện tại -> 422
        $resSame = $this->actingAs($admin, 'sanctum')->postJson("/api/customers/{$customer->id}/transfer-broker", [
            'target_broker_id' => $primaryBroker1->id,
            'reason' => 'Đổi người',
        ]);
        $resSame->assertStatus(422);

        // C. Chuyển thành công sang Người Phụ Trách Mới
        $resSuccess = $this->actingAs($admin, 'sanctum')->postJson("/api/customers/{$customer->id}/transfer-broker", [
            'target_broker_id' => $primaryBroker2->id,
            'reason' => 'Phân bổ theo khu vực địa bàn mới',
        ]);

        $resSuccess->assertOk();
        $this->assertEquals($primaryBroker2->id, $resSuccess->json('data.primary_broker_id'));
        $assignedToId = is_array($resSuccess->json('data.assigned_to'))
            ? $resSuccess->json('data.assigned_to.id')
            : $resSuccess->json('data.assigned_to');
        $this->assertEquals($brokerUser2->id, $assignedToId);

        $customer->refresh();
        $this->assertEquals($primaryBroker2->id, $customer->primary_broker_id);
        $this->assertEquals($brokerUser2->id, $customer->assigned_to);

        // Kiểm tra ActivityLog
        $this->assertDatabaseHas('activity_logs', [
            'table_name' => 'customers',
            'record_id' => $customer->id,
            'action' => 'CUSTOMER_BROKER_TRANSFERRED',
        ]);

        // Kiểm tra CustomerInteraction
        $this->assertDatabaseHas('customer_interactions', [
            'customer_id' => $customer->id,
            'type' => 'note',
        ]);
    }

    /**
     * 5. Test danh sách phân công eager-load quan hệ CRM và hỗ trợ filter
     */
    public function test_index_assignments_supports_customer_and_requirement_filters(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_filter@test.vn');
        $brokerUser = $this->makeUser(Role::Broker, 'broker_filt@test.vn');
        $broker = $this->makeBroker('Môi giới Test Filter', 'MG-FLT-01', $brokerUser);

        $customerA = $this->makeCustomer('Khách Hàng A', $broker);
        $customerB = $this->makeCustomer('Khách Hàng B', $broker);

        $demandA = $this->makeDemand($customerA);
        $demandB = $this->makeDemand($customerB);

        $assignA = BrokerAssignment::create([
            'request_code' => 'YC-FILTER-01',
            'customer_id' => $customerA->id,
            'requirement_id' => $demandA->id,
            'customer_name' => $customerA->name,
            'property_location' => 'Quận 2',
            'broker_id' => $broker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
        ]);

        $assignB = BrokerAssignment::create([
            'request_code' => 'YC-FILTER-02',
            'customer_id' => $customerB->id,
            'requirement_id' => $demandB->id,
            'customer_name' => $customerB->name,
            'property_location' => 'Quận 7',
            'broker_id' => $broker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        // Lọc theo customer_id = customerA->id
        $resA = $this->actingAs($admin, 'sanctum')->getJson("/api/broker-assignments?customer_id={$customerA->id}");
        $resA->assertOk();
        $this->assertCount(1, $resA->json('data'));
        $this->assertEquals('YC-FILTER-01', $resA->json('data.0.request_code'));
        $this->assertNotNull($resA->json('data.0.customer'));
        $this->assertNotNull($resA->json('data.0.requirement'));

        // Lọc theo requirement_id = demandB->id
        $resB = $this->actingAs($admin, 'sanctum')->getJson("/api/broker-assignments?requirement_id={$demandB->id}");
        $resB->assertOk();
        $this->assertCount(1, $resB->json('data'));
        $this->assertEquals('YC-FILTER-02', $resB->json('data.0.request_code'));
    }
}
