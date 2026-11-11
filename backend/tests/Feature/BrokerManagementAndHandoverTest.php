<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Broker;
use App\Models\BrokerAssignment;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BrokerManagementAndHandoverTest extends TestCase
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

    /**
     * 1. Test hồ sơ môi giới có thể tồn tại trước tài khoản (brokers.user_id nullable)
     */
    public function test_broker_can_be_created_without_user_id_and_user_id_is_nullable(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_broker@test.vn');

        // Tạo môi giới không truyền user_id
        $res = $this->actingAs($admin, 'sanctum')->postJson('/api/brokers', [
            'name' => 'Môi giới Chưa có tài khoản',
            'code' => 'MG-NOUSER-01',
            'phone' => '0912345678',
            'email' => 'nouser@3tvland.vn',
            'level' => 'Tập sự',
            'status' => 'active',
            'notes' => 'Hồ sơ tuyển dụng mới, chưa cấp user login.',
        ]);

        $res->assertCreated();
        $this->assertNull($res->json('data.user_id'));

        // Kiểm tra trong cơ sở dữ liệu
        $this->assertDatabaseHas('brokers', [
            'code' => 'MG-NOUSER-01',
            'name' => 'Môi giới Chưa có tài khoản',
            'user_id' => null,
        ]);

        // Cập nhật thông tin môi giới mà không có user_id vẫn thành công
        $brokerId = $res->json('data.id');
        $resUpdate = $this->actingAs($admin, 'sanctum')->putJson("/api/brokers/{$brokerId}", [
            'version' => 1,
            'name' => 'Môi giới Chưa có tài khoản (Đã sửa)',
            'code' => 'MG-NOUSER-01',
            'phone' => '0912345678',
            'email' => 'nouser@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => null,
        ]);
        $resUpdate->assertOk();
        $this->assertNull($resUpdate->json('data.user_id'));
    }

    /**
     * 2. Test Môi giới cần nhận việc thì phải liên kết tài khoản: validate chặn khi phân công và trả lỗi rõ ràng
     */
    public function test_assignment_fails_if_broker_has_no_linked_user_account(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_assign@test.vn');

        // Môi giới chưa liên kết tài khoản (user_id = null)
        $unlinkedBroker = Broker::create([
            'name' => 'Môi giới Không Tài Khoản',
            'code' => 'MG-UNLINKED',
            'phone' => '0911223344',
            'email' => 'unlinked@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => null,
        ]);

        // Thử phân công công việc cho môi giới chưa liên kết tài khoản
        $assignmentPayload = [
            'request_code' => 'YC-2026-UNLINKED',
            'customer_name' => 'Khách hàng Cần Tư Vấn',
            'customer_phone' => '0988776655',
            'customer_email' => 'customer@test.vn',
            'property_location' => 'Quận 2, TP. Thủ Đức',
            'broker_id' => $unlinkedBroker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'pending',
            'notes' => 'Yêu cầu tư vấn căn hộ 2 phòng ngủ.',
        ];

        $resAssign = $this->actingAs($admin, 'sanctum')->postJson('/api/broker-assignments', $assignmentPayload);
        $resAssign->assertStatus(422)
            ->assertJsonPath('status', 'error');

        // Kiểm tra thông báo lỗi trả về rõ ràng
        $message = $resAssign->json('message');
        $this->assertStringContainsString('chưa liên kết tài khoản người dùng nên không thể nhận việc/phân công', $message);
        $this->assertDatabaseMissing('broker_assignments', ['request_code' => 'YC-2026-UNLINKED']);

        // Sau đó, liên kết tài khoản cho môi giới này
        $brokerUser = $this->makeUser(Role::Broker, 'broker_linked@3tvland.vn');
        $resLink = $this->actingAs($admin, 'sanctum')->postJson("/api/brokers/{$unlinkedBroker->id}/link-user", [
            'version' => 1,
            'user_id' => $brokerUser->id,
        ]);
        $resLink->assertOk();
        $this->assertEquals($brokerUser->id, $unlinkedBroker->fresh()->user_id);

        // Phân công lại: Lần này PHẢI THÀNH CÔNG
        $resAssignSuccess = $this->actingAs($admin, 'sanctum')->postJson('/api/broker-assignments', $assignmentPayload);
        $resAssignSuccess->assertCreated()
            ->assertJsonPath('data.broker_id', $unlinkedBroker->id);
        $this->assertDatabaseHas('broker_assignments', ['request_code' => 'YC-2026-UNLINKED']);
    }

    /**
     * 3. Test phân công bị chặn nếu tài khoản người dùng liên kết đang bị khóa (inactive)
     */
    public function test_assignment_fails_if_broker_linked_user_is_inactive(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_inactive@test.vn');

        // Tạo user môi giới nhưng bị khóa (is_active = false)
        $inactiveUser = $this->makeUser(Role::Broker, 'inactive_broker@3tvland.vn', false);
        $broker = Broker::create([
            'name' => 'Môi giới Tài Khoản Bị Khóa',
            'code' => 'MG-LOCKED',
            'phone' => '0933445566',
            'email' => 'locked@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => $inactiveUser->id,
        ]);

        $res = $this->actingAs($admin, 'sanctum')->postJson('/api/broker-assignments', [
            'request_code' => 'YC-2026-LOCKED',
            'customer_name' => 'Khách hàng A',
            'customer_phone' => '0988776655',
            'property_location' => 'Quận 1',
            'broker_id' => $broker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('status', 'error');
        $this->assertStringContainsString('đang bị khóa hoặc không hoạt động', $res->json('message'));
    }

    /**
     * 4. Test xóa môi giới không còn việc đang phụ trách: Soft-delete trực tiếp và giữ nguyên lịch sử phân công
     */
    public function test_delete_broker_without_active_work_soft_deletes_immediately(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_del_clean@test.vn');
        $brokerUser = $this->makeUser(Role::Broker, 'broker_del_clean@3tvland.vn');

        $broker = Broker::create([
            'name' => 'Môi giới Không Việc Tồn',
            'code' => 'MG-CLEAN',
            'phone' => '0944556677',
            'email' => 'clean@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => $brokerUser->id,
        ]);

        // Tạo 1 việc ĐÃ HOÀN THÀNH trong quá khứ (completed)
        $completedAssignment = BrokerAssignment::create([
            'request_code' => 'YC-PAST-01',
            'customer_name' => 'Khách cũ',
            'property_location' => 'Bình Thạnh',
            'broker_id' => $broker->id,
            'assigned_date' => now()->subMonths(2)->toDateString(),
            'status' => 'completed',
        ]);

        // Xóa môi giới: Không có việc pending/processing -> Xóa mềm thành công ngay
        $resDelete = $this->actingAs($admin, 'sanctum')->deleteJson("/api/brokers/{$broker->id}", [
            'version' => 1,
        ]);

        $resDelete->assertOk()
            ->assertJsonPath('status', 'success');

        // Kiểm tra môi giới đã bị soft delete (deleted_at != null)
        $this->assertSoftDeleted('brokers', ['id' => $broker->id]);
        $this->assertNotNull(Broker::withTrashed()->find($broker->id)->deleted_at);

        // LỊCH SỬ PHÂN CÔNG GIỮ NGUYÊN: Phân công cũ vẫn trỏ tới broker_id cũ và vẫn lấy được tên môi giới
        $this->assertEquals($broker->id, $completedAssignment->fresh()->broker_id);
        $this->assertNotNull($completedAssignment->fresh()->broker);
        $this->assertEquals('Môi giới Không Việc Tồn', $completedAssignment->fresh()->broker->name);
    }

    /**
     * 5. Test xóa môi giới còn việc/khách đang phụ trách nhưng không chọn môi giới bàn giao -> Bị chặn (422)
     */
    public function test_delete_broker_with_active_work_without_handover_is_rejected(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_check_act@test.vn');
        $brokerUser = $this->makeUser(Role::Broker, 'broker_busy@3tvland.vn');

        $broker = Broker::create([
            'name' => 'Môi giới Đang Bận Việc',
            'code' => 'MG-BUSY-01',
            'phone' => '0955667788',
            'email' => 'busy@3tvland.vn',
            'level' => 'Trưởng nhóm',
            'status' => 'busy',
            'user_id' => $brokerUser->id,
        ]);

        // Có 1 việc đang xử lý (processing)
        BrokerAssignment::create([
            'request_code' => 'YC-ACT-01',
            'customer_name' => 'Khách VIP',
            'property_location' => 'Quận 1',
            'broker_id' => $broker->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
        ]);

        // Có 1 khách hàng CRM đang phụ trách
        Customer::create([
            'name' => 'Khách hàng CRM Đang Chăm Sóc',
            'phone' => '0977112233',
            'email' => 'khachcrm@gmail.com',
            'customer_group' => 'potential',
            'status' => 'contacted',
            'assigned_to' => $brokerUser->id,
        ]);

        // Gọi API kiểm tra active-work trước khi xóa
        $resCheck = $this->actingAs($admin, 'sanctum')->getJson("/api/brokers/{$broker->id}/active-work");
        $resCheck->assertOk()
            ->assertJsonPath('has_active_work', true)
            ->assertJsonPath('total_active', 2)
            ->assertJsonPath('active_assignments_count', 1)
            ->assertJsonPath('active_customers_count', 1);

        // Gọi DELETE không truyền handover_broker_id -> Phải bị chặn 422
        $resDelete = $this->actingAs($admin, 'sanctum')->deleteJson("/api/brokers/{$broker->id}", [
            'version' => 1,
        ]);

        $resDelete->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('requires_handover', true)
            ->assertJsonPath('total_active', 2);

        $this->assertStringContainsString('Vui lòng chọn môi giới nhận bàn giao trước khi xóa', $resDelete->json('message'));

        // Môi giới VẪN CHƯA BỊ XÓA
        $this->assertDatabaseHas('brokers', ['id' => $broker->id, 'deleted_at' => null]);
    }

    /**
     * 6. Test xóa môi giới có bàn giao: chuyển việc đang phụ trách, giữ nguyên lịch sử cũ, và soft-delete
     */
    public function test_delete_broker_with_handover_transfers_work_soft_deletes_and_preserves_history(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_handover@test.vn');
        $userA = $this->makeUser(Role::Broker, 'broker_a@3tvland.vn');
        $userB = $this->makeUser(Role::Broker, 'broker_b@3tvland.vn');

        // Môi giới A (sắp bị xóa)
        $brokerA = Broker::create([
            'name' => 'Môi giới A (Nghỉ việc)',
            'code' => 'MG-A',
            'phone' => '0966778899',
            'email' => 'broker_a@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => $userA->id,
        ]);

        // Môi giới B (nhận bàn giao)
        $brokerB = Broker::create([
            'name' => 'Môi giới B (Nhận bàn giao)',
            'code' => 'MG-B',
            'phone' => '0977889900',
            'email' => 'broker_b@3tvland.vn',
            'level' => 'Trưởng nhóm',
            'status' => 'active',
            'user_id' => $userB->id,
        ]);

        // 1. Phân công đang pending (cần bàn giao)
        $pendingAssignment = BrokerAssignment::create([
            'request_code' => 'YC-PENDING-01',
            'customer_name' => 'Khách Cần Tư Vấn',
            'property_location' => 'Quận 7',
            'broker_id' => $brokerA->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'pending',
            'notes' => 'Ghi chú ban đầu.',
        ]);

        // 2. Phân công đang processing (cần bàn giao)
        $processingAssignment = BrokerAssignment::create([
            'request_code' => 'YC-PROC-01',
            'customer_name' => 'Khách Đang Đàm Phán',
            'property_location' => 'Quận 2',
            'broker_id' => $brokerA->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'processing',
        ]);

        // 3. Phân công ĐÃ HOÀN THÀNH (Lịch sử: KHÔNG được đổi broker_id)
        $completedAssignment = BrokerAssignment::create([
            'request_code' => 'YC-HIST-01',
            'customer_name' => 'Khách Đã Xong Giao Dịch',
            'property_location' => 'Quận 3',
            'broker_id' => $brokerA->id,
            'assigned_date' => now()->subMonth()->toDateString(),
            'status' => 'completed',
        ]);

        // 4. Khách hàng CRM do Môi giới A phụ trách
        $customer = Customer::create([
            'name' => 'Khách Hàng Thân Thiết A',
            'phone' => '0988112233',
            'email' => 'khacha@gmail.com',
            'customer_group' => 'loyal',
            'status' => 'deal',
            'assigned_to' => $userA->id,
        ]);

        // Thực hiện xóa kèm bàn giao sang Môi giới B
        $resDelete = $this->actingAs($admin, 'sanctum')->deleteJson("/api/brokers/{$brokerA->id}", [
            'version' => 1,
            'handover_broker_id' => $brokerB->id,
        ]);

        $resDelete->assertOk()
            ->assertJsonPath('status', 'success');
        $this->assertStringContainsString("Đã bàn giao 3 việc/khách hàng sang môi giới '{$brokerB->name}'", $resDelete->json('message'));

        // A. Kiểm tra Môi giới A đã bị Soft Delete
        $this->assertSoftDeleted('brokers', ['id' => $brokerA->id]);

        // B. Việc pending & processing đã chuyển sang Môi giới B
        $this->assertEquals($brokerB->id, $pendingAssignment->fresh()->broker_id);
        $this->assertStringContainsString('[Bàn giao từ MG ' . $brokerA->name, $pendingAssignment->fresh()->notes);

        $this->assertEquals($brokerB->id, $processingAssignment->fresh()->broker_id);
        $this->assertStringContainsString('[Bàn giao từ MG ' . $brokerA->name, $processingAssignment->fresh()->notes);

        // C. Khách hàng CRM đã chuyển sang User của Môi giới B
        $this->assertEquals($userB->id, $customer->fresh()->assigned_to);

        // D. LỊCH SỬ PHÂN CÔNG GIỮ NGUYÊN: Việc completed vẫn trỏ tới Broker A
        $this->assertEquals($brokerA->id, $completedAssignment->fresh()->broker_id);
        $this->assertNotNull($completedAssignment->fresh()->broker);
        $this->assertEquals($brokerA->name, $completedAssignment->fresh()->broker->name);
    }

    /**
     * 7. Test không thể bàn giao cho môi giới chưa liên kết tài khoản
     */
    public function test_handover_broker_must_have_linked_user_account_to_receive_handover(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_check_unlinked@test.vn');
        $userA = $this->makeUser(Role::Broker, 'broker_a2@3tvland.vn');

        $brokerA = Broker::create([
            'name' => 'Môi giới A Cần Bàn Giao',
            'code' => 'MG-A2',
            'phone' => '0966778811',
            'email' => 'broker_a2@3tvland.vn',
            'level' => 'Chuyên viên',
            'status' => 'active',
            'user_id' => $userA->id,
        ]);

        // Môi giới C không có tài khoản (user_id = null)
        $brokerC = Broker::create([
            'name' => 'Môi giới C Chưa Có Tài Khoản',
            'code' => 'MG-C',
            'phone' => '0966778822',
            'email' => 'broker_c@3tvland.vn',
            'level' => 'Tập sự',
            'status' => 'active',
            'user_id' => null,
        ]);

        // Có việc cần bàn giao
        BrokerAssignment::create([
            'request_code' => 'YC-HANDOVER-CHECK',
            'customer_name' => 'Khách Bàn Giao',
            'property_location' => 'Quận 4',
            'broker_id' => $brokerA->id,
            'assigned_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        // Thử bàn giao cho Broker C chưa có tài khoản -> Bị chặn 422
        $res = $this->actingAs($admin, 'sanctum')->deleteJson("/api/brokers/{$brokerA->id}", [
            'version' => 1,
            'handover_broker_id' => $brokerC->id,
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('status', 'error');
        $this->assertStringContainsString('chưa liên kết tài khoản người dùng nên không thể nhận việc', $res->json('message'));
        $this->assertDatabaseHas('brokers', ['id' => $brokerA->id, 'deleted_at' => null]);
    }
}

