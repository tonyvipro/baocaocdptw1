<?php

namespace Tests\Feature;

use App\Models\{ActivityLog, Category, Role, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DetailedActivityAuditTest extends TestCase
{
    use RefreshDatabase;

    private function account(int $role): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => $role === 1 ? 'Admin' : 'Khách hàng']);
        return User::create(['role_id' => $role, 'name' => 'Người dùng '.$role, 'email' => 'account'.$role.'@icloud.com',
            'password' => 'Secret-password9', 'phone' => '0901234567', 'is_active' => true])->refresh();
    }

    public function test_category_update_records_only_actual_fields_with_before_and_after_values(): void
    {
        $this->actingAs($this->account(1));
        $category = Category::create(['name' => 'Căn hộ', 'slug' => 'can-ho', 'description' => 'Mô tả cũ', 'status' => 'active']);
        $this->putJson('/api/categories/'.$category->id, ['version' => 1, 'name' => 'Nhà phố', 'description' => 'Mô tả mới', 'status' => 'active'])->assertOk();
        $log = ActivityLog::where('table_name', 'categories')->where('action', 'UPDATE')->sole();
        $this->assertSame(['name', 'description'], array_column($log->new_data['changes'], 'field'));
        $this->assertSame('Căn hộ', $log->new_data['changes'][0]['before']);
        $this->assertSame('Nhà phố', $log->new_data['changes'][0]['after']);
        $this->getJson('/api/notifications')->assertOk()->assertJsonPath('logs.data.0.changes.0.label', 'Tên')
            ->assertJsonPath('logs.data.0.changes.0.after', 'Nhà phố')
            ->assertJsonPath('logs.data.0.destination.url', '#admin/categories?record='.$category->id);
    }

    public function test_role_assignment_has_human_readable_roles_and_password_never_leaks(): void
    {
        $admin = $this->account(1); $customer = $this->account(5);
        Role::forceCreate(['id' => 2, 'name' => 'Môi giới']);
        $this->actingAs($admin)->putJson('/api/users/'.$customer->id.'/assign-role', ['version' => 1, 'role_id' => 2])->assertOk();
        $change = ActivityLog::where('action', 'UPDATE')->sole()->new_data['changes'][0];
        $this->assertSame('role_id', $change['field']);
        $this->assertSame('Khách hàng (#5)', $change['before']);
        $this->assertSame('Môi giới (#2)', $change['after']);
        $this->putJson('/api/users/'.$customer->id, ['version' => 2, 'password' => 'New-secret-password9'])->assertOk();
        $audit = ActivityLog::all()->toJson();
        $this->assertStringNotContainsString('New-secret-password9', $audit);
        $this->assertStringNotContainsString('$2y$', $audit);
        $this->assertStringContainsString('password', $audit);
    }

    public function test_profile_compares_real_changes_and_masks_private_contact_values(): void
    {
        $user = $this->account(5);
        $this->actingAs($user)->postJson('/api/profile', ['version' => 1, 'name' => $user->name, 'phone' => '0912345678'])->assertOk();
        $log = ActivityLog::where('action', 'PROFILE_UPDATE')->sole();
        $this->assertSame(['phone'], array_column($log->new_data['changes'], 'field'));
        $this->assertSame('******4567', $log->new_data['changes'][0]['before']);
        $this->assertSame('******5678', $log->new_data['changes'][0]['after']);
        $this->assertStringNotContainsString('0912345678', $log->toJson());
        $this->assertSame(1, $user->notifications()->count());
    }

    public function test_rejected_and_stale_updates_do_not_produce_fake_success_logs(): void
    {
        $this->actingAs($this->account(1));
        $category = Category::create(['name' => 'Căn hộ', 'slug' => 'stale', 'status' => 'active']);
        $this->putJson('/api/categories/'.$category->id, ['version' => 1, 'name' => ''])->assertUnprocessable();
        $this->putJson('/api/categories/'.$category->id, ['version' => 99, 'name' => 'Sai phiên bản'])->assertConflict();
        $this->assertDatabaseCount('activity_logs', 0);
    }

    public function test_existing_property_snapshot_logs_are_presented_as_safe_field_changes(): void
    {
        $admin = $this->account(1);
        ActivityLog::create(['user_id' => $admin->id, 'table_name' => 'properties', 'record_id' => 8, 'action' => 'UPDATE',
            'old_data' => ['title' => 'Căn cũ', 'price' => '1000.00', 'owner_phone' => '0901234567', 'password' => 'private-hash'],
            'new_data' => ['title' => 'Căn mới', 'price' => 1000, 'owner_phone' => '0912345678', 'password' => 'new-private-hash']]);
        $response = $this->actingAs($admin)->getJson('/api/notifications')->assertOk();
        $response->assertJsonPath('logs.data.0.changes.0.before', 'Căn cũ')->assertJsonPath('logs.data.0.changes.0.after', 'Căn mới');
        $response->assertJsonCount(1, 'logs.data.0.changes');
        $this->assertStringNotContainsString('private-hash', $response->getContent());
        $this->assertStringNotContainsString('0912345678', $response->getContent());
    }
}
