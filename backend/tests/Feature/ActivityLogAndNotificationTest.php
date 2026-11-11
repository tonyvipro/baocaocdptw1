<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Role as RoleModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ActivityLogAndNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function ensureRole(Role $role): void
    {
        if (!RoleModel::find($role->value)) {
            RoleModel::forceCreate([
                'id' => $role->value,
                'name' => $role->databaseName(),
                'description' => $role->description(),
            ]);
        }
    }

    private function makeUser(Role $role, string $email = null): User
    {
        $this->ensureRole($role);
        return User::create([
            'name' => 'User ' . $role->name,
            'email' => $email ?? (strtolower($role->name) . '_' . Str::random(6) . '@test.vn'),
            'password' => bcrypt('Password@123'),
            'role_id' => $role->value,
            'is_active' => true,
        ]);
    }

    /**
     * 1. Test snapshot người thực hiện được lưu đầy đủ và không mất khi user bị xóa
     */
    public function test_activity_log_saves_actor_snapshot_and_persists_after_user_deletion(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_snap@test.vn');
        $broker = $this->makeUser(Role::Broker, 'broker_snap@test.vn');

        // Broker tạo khách hàng
        $res = $this->actingAs($broker, 'sanctum')->postJson('/api/customers', [
            'name' => 'Khách Hàng A',
            'phone' => '0901234567',
            'email' => 'khacha@test.vn',
            'customer_group' => 'new',
            'status' => 'new',
        ]);
        $res->assertCreated();

        // Kiểm tra log được lưu với đầy đủ snapshot
        $log = ActivityLog::where('table_name', 'customers')
            ->where('action', 'CUSTOMER_CREATE')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals($broker->id, $log->user_id);
        $this->assertEquals($broker->id, $log->actor_id);
        $this->assertEquals($broker->name, $log->actor_name);
        $this->assertTrue(in_array($log->actor_role, ['BĐS', 'Môi giới', 'Broker (Môi giới)']));
        $this->assertIsArray($log->actor_snapshot);
        $this->assertEquals($broker->email, $log->actor_snapshot['email']);

        // Xóa user Broker (vật lý bằng forceDelete để test nullOnDelete và không cascade delete log)
        $brokerId = $broker->id;
        $broker->forceDelete();

        // Log VẪN TỒN TẠI trong database, không bị cascade delete
        $log->refresh();
        $this->assertNull($log->user_id); // Đã được nullOnDelete
        $this->assertEquals($brokerId, $log->actor_id);
        $this->assertEquals('User Broker', $log->actor_name);
        $this->assertTrue(in_array($log->actor_role, ['BĐS', 'Môi giới', 'Broker (Môi giới)']));

        // Khi Admin xem danh sách nhật ký, tên người thực hiện vẫn được hiển thị đúng từ snapshot
        $listRes = $this->actingAs($admin, 'sanctum')->getJson('/api/notifications');
        $listRes->assertOk();

        $logsData = $listRes->json('logs.data');
        $this->assertNotEmpty($logsData);
        $firstLog = collect($logsData)->firstWhere('id', $log->id);
        $this->assertNotNull($firstLog);
        $this->assertStringContainsString('User Broker', $firstLog['user']);
        $this->assertTrue(str_contains($firstLog['user'], 'BĐS') || str_contains($firstLog['user'], 'Môi giới') || str_contains($firstLog['user'], 'Broker'));
    }

    /**
     * 2. Test thao tác thất bại / rollback KHÔNG để lại log thành công
     */
    public function test_activity_log_is_not_persisted_when_transaction_is_rolled_back(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_rollback@test.vn');

        $initialLogCount = ActivityLog::count();

        // Thực hiện transaction bị ném ngoại lệ và rollback
        try {
            DB::transaction(function () use ($admin) {
                ActivityLog::create(array_merge([
                    'user_id' => $admin->id,
                    'action' => 'TEST_FAILED_ACTION',
                    'table_name' => 'users',
                    'record_id' => $admin->id,
                    'new_data' => ['description' => 'Thao tác sẽ bị hủy'],
                ], ActivityLog::extractActorSnapshot($admin)));

                // Giả lập lỗi phát sinh làm rollback transaction
                throw new \Exception('Cố tình gây lỗi để rollback transaction!');
            });
        } catch (\Throwable $e) {
            // Đã bắt ngoại lệ
        }

        // Đảm bảo không có bản ghi activity log nào bị lưu lại sau rollback
        $this->assertEquals($initialLogCount, ActivityLog::count());
        $this->assertDatabaseMissing('activity_logs', ['action' => 'TEST_FAILED_ACTION']);
    }

    /**
     * 3. Test phân quyền xem nhật ký: Admin xem được toàn bộ, người dùng thường chỉ xem của chính mình
     */
    public function test_activity_log_role_based_scoping(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_scope@test.vn');
        $broker = $this->makeUser(Role::Broker, 'broker_scope@test.vn');
        $customer = $this->makeUser(Role::Customer, 'customer_scope@test.vn');

        // Tạo 3 log riêng biệt cho 3 user
        ActivityLog::create(array_merge([
            'user_id' => $admin->id,
            'action' => 'LOGIN',
            'table_name' => 'users',
            'record_id' => $admin->id,
            'new_data' => ['description' => 'Admin đăng nhập'],
        ], ActivityLog::extractActorSnapshot($admin)));

        ActivityLog::create(array_merge([
            'user_id' => $broker->id,
            'action' => 'LOGIN',
            'table_name' => 'users',
            'record_id' => $broker->id,
            'new_data' => ['description' => 'Broker đăng nhập'],
        ], ActivityLog::extractActorSnapshot($broker)));

        ActivityLog::create(array_merge([
            'user_id' => $customer->id,
            'action' => 'LOGIN',
            'table_name' => 'users',
            'record_id' => $customer->id,
            'new_data' => ['description' => 'Customer đăng nhập'],
        ], ActivityLog::extractActorSnapshot($customer)));

        // 1. Customer xem: chỉ thấy log của chính mình
        $resCustomer = $this->actingAs($customer, 'sanctum')->getJson('/api/notifications');
        $resCustomer->assertOk();
        $this->assertEquals('personal', $resCustomer->json('log_scope'));
        $customerLogs = $resCustomer->json('logs.data');
        $this->assertCount(1, $customerLogs);
        $this->assertEquals($customer->id, $customerLogs[0]['actor_id']);

        // Dù Customer cố tình truyền query actor_id=$admin->id, hệ thống vẫn ép buộc chỉ trả về của mình
        $resCustomerSpoof = $this->actingAs($customer, 'sanctum')->getJson('/api/notifications?actor_id=' . $admin->id);
        $resCustomerSpoof->assertOk();
        $spoofedLogs = $resCustomerSpoof->json('logs.data');
        $this->assertCount(1, $spoofedLogs);
        $this->assertEquals($customer->id, $spoofedLogs[0]['actor_id']);

        // 2. Admin xem: thấy toàn bộ log hệ thống (tối thiểu 3 bản ghi)
        $resAdmin = $this->actingAs($admin, 'sanctum')->getJson('/api/notifications');
        $resAdmin->assertOk();
        $this->assertEquals('system', $resAdmin->json('log_scope'));
        $this->assertGreaterThanOrEqual(3, $resAdmin->json('logs.meta.total'));

        // Admin lọc theo actor_id=$broker->id
        $resAdminFilter = $this->actingAs($admin, 'sanctum')->getJson('/api/notifications?actor_id=' . $broker->id);
        $resAdminFilter->assertOk();
        $filteredLogs = $resAdminFilter->json('logs.data');
        $this->assertCount(1, $filteredLogs);
        $this->assertEquals($broker->id, $filteredLogs[0]['actor_id']);
    }

    /**
     * 4. Test bộ lọc nhật ký theo thời gian và loại thao tác có phân trang
     */
    public function test_activity_log_filters_by_date_and_action_with_pagination(): void
    {
        $admin = $this->makeUser(Role::Admin, 'admin_filter@test.vn');

        // Tạo các log ở thời điểm khác nhau
        $yesterday = Carbon::now('Asia/Ho_Chi_Minh')->subDay();
        $today = Carbon::now('Asia/Ho_Chi_Minh');

        ActivityLog::create(array_merge([
            'user_id' => $admin->id,
            'action' => 'LOGIN',
            'table_name' => 'users',
            'record_id' => $admin->id,
            'new_data' => ['description' => 'Log hôm qua'],
            'created_at' => $yesterday,
            'updated_at' => $yesterday,
        ], ActivityLog::extractActorSnapshot($admin)));

        ActivityLog::create(array_merge([
            'user_id' => $admin->id,
            'action' => 'LOGOUT',
            'table_name' => 'users',
            'record_id' => $admin->id,
            'new_data' => ['description' => 'Log hôm nay action LOGOUT'],
            'created_at' => $today,
            'updated_at' => $today,
        ], ActivityLog::extractActorSnapshot($admin)));

        ActivityLog::create(array_merge([
            'user_id' => $admin->id,
            'action' => 'PROFILE_UPDATE',
            'table_name' => 'users',
            'record_id' => $admin->id,
            'new_data' => ['description' => 'Log hôm nay action PROFILE_UPDATE'],
            'created_at' => $today,
            'updated_at' => $today,
        ], ActivityLog::extractActorSnapshot($admin)));

        // Lọc theo action = LOGOUT
        $resAction = $this->actingAs($admin, 'sanctum')->getJson('/api/notifications?action=LOGOUT');
        $resAction->assertOk();
        $this->assertEquals(1, $resAction->json('logs.meta.total'));
        $this->assertEquals('LOGOUT', $resAction->json('logs.data.0.raw_action'));

        // Lọc theo ngày hôm nay
        $todayDateStr = $today->format('Y-m-d');
        $resDate = $this->actingAs($admin, 'sanctum')->getJson("/api/notifications?start_date={$todayDateStr}&end_date={$todayDateStr}");
        $resDate->assertOk();
        $this->assertEquals(2, $resDate->json('logs.meta.total'));

        // Phân trang với per_page = 1
        $resPaging = $this->actingAs($admin, 'sanctum')->getJson('/api/notifications?per_page=1&log_page=1');
        $resPaging->assertOk();
        $this->assertCount(1, $resPaging->json('logs.data'));
        $this->assertEquals(1, $resPaging->json('logs.meta.current_page'));
        $this->assertGreaterThanOrEqual(3, $resPaging->json('logs.meta.total'));
    }

    /**
     * 5. Test thông báo theo tài khoản và đánh dấu đã đọc
     */
    public function test_notifications_per_account_and_mark_all_read(): void
    {
        $user = $this->makeUser(Role::Customer, 'cust_notify@test.vn');

        // Tạo 3 thông báo chưa đọc cho user
        for ($i = 1; $i <= 3; $i++) {
            DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'type' => 'App\Notifications\GeneralNotification',
                'data' => json_encode([
                    'category' => 'Hệ thống',
                    'message' => "Thông báo thử nghiệm số {$i}",
                ], JSON_UNESCAPED_UNICODE),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Gọi API kiểm tra unread_count = 3
        $resIndex = $this->actingAs($user, 'sanctum')->getJson('/api/notifications');
        $resIndex->assertOk()
            ->assertJsonPath('unread_count', 3)
            ->assertJsonCount(3, 'notifications.data');

        // Đánh dấu tất cả là đã đọc
        $resMark = $this->actingAs($user, 'sanctum')->patchJson('/api/notifications/read-all');
        $resMark->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('updated', 3)
            ->assertJsonPath('unread_count', 0);

        // Kiểm tra unread_count trên endpoint riêng
        $resCount = $this->actingAs($user, 'sanctum')->getJson('/api/notifications/unread-count');
        $resCount->assertOk()->assertJsonPath('unread_count', 0);
    }
}
