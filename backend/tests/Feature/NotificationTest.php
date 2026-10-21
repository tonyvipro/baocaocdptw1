<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use App\Services\NotificationInbox;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $role = 5): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);
        return User::create(['name' => 'Nguyễn Văn An', 'email' => uniqid().'@example.com', 'password' => 'real-test-password', 'role_id' => $role, 'is_active' => true]);
    }

    private function contract(User $customer, ?User $broker = null, array $changes = []): Contract
    {
        $property = Property::create(['title' => 'Căn hộ kiểm thử', 'price' => 1000000, 'area' => 50]);
        return Contract::create(array_merge(['property_id' => $property->id, 'customer_id' => $customer->id, 'broker_id' => $broker?->id,
            'contract_code' => 'HD-'.uniqid(), 'contract_name' => 'Hợp đồng thuê nhà', 'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(), 'status' => 0], $changes));
    }

    private function log(User $user, string $details = 'Đăng nhập hệ thống', string $action = 'LOGIN'): ActivityLog
    {
        return ActivityLog::create(['user_id' => $user->id, 'action' => $action, 'table_name' => 'users', 'record_id' => $user->id,
            'new_data' => ['description' => $details]]);
    }

    public function test_endpoints_require_actual_active_identity_and_ignore_payload_identity(): void
    {
        $admin = $this->user(1);
        $this->getJson('/api/notifications?user_id='.$admin->id)->assertUnauthorized();
        $this->getJson('/api/notifications/unread-count')->assertUnauthorized();
        $this->patchJson('/api/notifications/read-all', ['user_id' => $admin->id])->assertUnauthorized();
        $this->getJson('/api/notifications/logs/download')->assertUnauthorized();
        $this->withToken('invalid')->getJson('/api/notifications')->assertUnauthorized();
        $admin->update(['is_active' => false]);
        $this->actingAs($admin)->getJson('/api/notifications')->assertUnauthorized();
    }

    public function test_notifications_are_personal_and_mark_all_read_persists_without_touching_others(): void
    {
        $admin = $this->user(1);
        $other = $this->user();
        $inbox = app(NotificationInbox::class);
        for ($i = 0; $i < 12; $i++) $inbox->publish($admin, 'warning', 'Thông báo '.$i, 'test:'.$i);
        $inbox->publish($other, 'payment', 'Riêng tư', 'other');
        $this->actingAs($admin)->getJson('/api/notifications')->assertOk()->assertJsonPath('unread_count', 12)
            ->assertJsonPath('notifications.meta.total', 12)->assertJsonCount(10, 'notifications.data')
            ->assertJsonPath('notifications.data.0.category', 'Cảnh báo');
        $this->getJson('/api/notifications?notification_page=2')->assertJsonCount(2, 'notifications.data');
        $this->patchJson('/api/notifications/read-all')->assertOk()->assertJsonPath('updated', 12)->assertJsonPath('unread_count', 0);
        $this->patchJson('/api/notifications/read-all')->assertJsonPath('updated', 0);
        $inbox->publish($admin, 'warning', 'Thông báo 0', 'test:0');
        $this->getJson('/api/notifications/unread-count')->assertJsonPath('unread_count', 0);
        $this->assertEquals(1, $other->unreadNotifications()->count());
        $this->getJson('/api/notifications?log_page=0')->assertUnprocessable();
    }

    public function test_notifications_use_real_related_contracts_and_invoices_without_duplicates(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 20)->setTime(5, 0));
        $customer = $this->user();
        $broker = $this->user(2);
        $other = $this->user();
        $contract = $this->contract($customer, $broker, ['status' => 1, 'end_date' => '2026-10-23']);
        $foreign = $this->contract($other, null, ['status' => 1, 'end_date' => '2026-10-21']);
        foreach ([$contract, $foreign] as $row) {
            foreach ([0, 1] as $status) DB::table('invoices')->insert(['contract_id' => $row->id, 'title' => 'Tiền thuê', 'type' => 'rent', 'amount' => 1000000,
                'due_date' => '2026-10-19', 'status' => $status, 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->actingAs($customer)->getJson('/api/notifications')->assertOk()->assertJsonPath('notifications.meta.total', 3);
        $this->assertEquals(3, $customer->notifications()->count());
        $this->patchJson('/api/notifications/read-all')->assertOk();
        $this->getJson('/api/notifications/unread-count')->assertJsonPath('unread_count', 0);
        $this->actingAs($broker)->getJson('/api/notifications')->assertJsonPath('notifications.meta.total', 3);
        $this->actingAs($this->user(1))->getJson('/api/notifications')->assertJsonPath('notifications.meta.total', 6);
    }

    public function test_logs_scope_pagination_legacy_payload_and_csv_export_all_rows(): void
    {
        $admin = $this->user(1);
        $customer = $this->user();
        $customer->update(['name' => '=HYPERLINK("evil")']);
        for ($i = 0; $i < 12; $i++) $this->log($customer, 'Lần đăng nhập '.$i);
        $this->log($admin, 'Riêng quản trị');
        $legacy = $this->log($customer);
        $legacy->update(['new_data' => ['password' => 'NEVER-EXPOSE-SECRET']]);
        $this->actingAs($customer)->getJson('/api/notifications')->assertJsonPath('log_scope', 'personal')
            ->assertJsonPath('logs.meta.total', 13)->assertJsonCount(10, 'logs.data')->assertDontSee('NEVER-EXPOSE-SECRET');
        $this->getJson('/api/notifications?log_page=2')->assertJsonCount(3, 'logs.data');
        $response = $this->get('/api/notifications/logs/download')->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringNotContainsString('Riêng quản trị', $csv);
        $this->assertStringNotContainsString('NEVER-EXPOSE-SECRET', $csv);
        $this->assertCount(14, array_filter(explode("\n", trim($csv))));
        $this->actingAs($admin)->getJson('/api/notifications')->assertJsonPath('log_scope', 'system')->assertJsonPath('logs.meta.total', 14);
        $all = $this->get('/api/notifications/logs/download')->streamedContent();
        $this->assertStringContainsString('Riêng quản trị', $all);
    }

    public function test_successful_login_profile_and_logout_record_safe_audit_entries(): void
    {
        $user = $this->user();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])->assertStatus(401);
        $this->assertDatabaseCount('activity_logs', 0);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'real-test-password'])->assertOk();
        $this->assertDatabaseHas('activity_logs', ['user_id' => $user->id, 'action' => 'LOGIN']);
        $this->postJson('/api/profile', ['name' => 'Tên mới', 'phone' => '0901234567'])->assertOk();
        $this->assertDatabaseHas('activity_logs', ['user_id' => $user->id, 'action' => 'PROFILE_UPDATE']);
        $this->assertEquals(1, $user->notifications()->count());
        $this->postJson('/api/profile', ['name' => '', 'phone' => 'abc'])->assertUnprocessable();
        $this->assertEquals(1, ActivityLog::where('action', 'PROFILE_UPDATE')->count());
        $this->postJson('/api/logout')->assertOk();
        $this->assertDatabaseHas('activity_logs', ['user_id' => $user->id, 'action' => 'LOGOUT']);
        $this->assertStringNotContainsString('real-test-password', ActivityLog::all()->toJson());
        $this->assertStringNotContainsString('0901234567', ActivityLog::all()->toJson());
    }

    public function test_contract_activation_is_audited_and_notifies_only_its_participants(): void
    {
        $admin = $this->user(1);
        $broker = $this->user(2);
        $customer = $this->user();
        $other = $this->user();
        $contract = $this->contract($customer, $broker);
        $this->actingAs($admin)->patchJson('/api/contracts/'.$contract->id.'/status', ['status' => 8])->assertUnprocessable();
        $this->assertDatabaseCount('activity_logs', 0);
        $this->patchJson('/api/contracts/'.$contract->id.'/status', ['status' => 1])->assertOk();
        $this->assertDatabaseHas('activity_logs', ['user_id' => $admin->id, 'action' => 'CONTRACT_SIGN', 'record_id' => $contract->id]);
        foreach ([$admin, $broker, $customer] as $recipient) $this->assertEquals(1, $recipient->notifications()->count());
        $this->assertEquals(0, $other->notifications()->count());
        $this->patchJson('/api/contracts/'.$contract->id.'/status', ['status' => 1])->assertOk();
        $this->assertEquals(1, ActivityLog::where('action', 'CONTRACT_SIGN')->count());
        $this->assertEquals(1, $customer->notifications()->count());
    }

    public function test_personal_access_works_with_bearer_token_without_a_web_session(): void
    {
        $user = $this->user();
        app(NotificationInbox::class)->publish($user, 'profile', 'Hồ sơ đã cập nhật', 'token-test');
        $token = $user->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/notifications')->assertOk()->assertJsonPath('notifications.meta.total', 1);
        $this->withToken($token)->patchJson('/api/notifications/read-all')->assertOk()->assertJsonPath('updated', 1);
    }
}
