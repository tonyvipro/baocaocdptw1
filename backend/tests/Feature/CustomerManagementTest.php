<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerManagementTest extends TestCase
{
    use RefreshDatabase;

    private function manager(int $role = 1): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);
        return User::create(['name' => 'Nhân viên '.$role, 'email' => uniqid().'@example.com', 'password' => 'test-password', 'role_id' => $role, 'is_active' => true]);
    }

    private function customer(array $overrides = []): array
    {
        return array_merge(['name' => 'Lê Thị C', 'company' => 'Công ty MNO', 'source' => 'Website', 'email' => 'customer@example.com',
            'phone' => '0901234567', 'customer_group' => 'potential', 'status' => 'contacted'], $overrides);
    }

    public function test_crm_requires_real_active_admin_or_broker_identity(): void
    {
        $this->getJson('/api/customers')->assertUnauthorized();
        $this->getJson('/api/customers/options')->assertUnauthorized();
        $this->postJson('/api/customers', $this->customer())->assertUnauthorized();
        $this->actingAs($this->manager(5))->getJson('/api/customers')->assertForbidden();
        $inactive = $this->manager(2);
        $inactive->update(['is_active' => false]);
        $this->actingAs($inactive)->getJson('/api/customers')->assertUnauthorized();
    }

    public function test_admin_crud_search_filters_pagination_and_conflict_detection(): void
    {
        $this->actingAs($admin = $this->manager());
        $broker = $this->manager(2);
        $row = $this->postJson('/api/customers', $this->customer(['assigned_to' => $broker->id]))
            ->assertCreated()->assertJsonPath('data.version', 1)->json('data');
        $this->getJson('/api/customers?search=MNO&group=potential&status=contacted&per_page=1')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.assigned_to.name', $broker->name);
        $this->getJson('/api/customers?search='.$row['code'])->assertJsonPath('meta.total', 1);
        $this->getJson('/api/customers?search=0901234567')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/customers?status=won')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/customers/'.$row['id'])->assertOk()->assertJsonPath('interactions.total', 0);
        $this->putJson('/api/customers/'.$row['id'], $this->customer(['name' => 'Tên mới', 'version' => 1, 'assigned_to' => $admin->id]))
            ->assertOk()->assertJsonPath('data.version', 2);
        $this->putJson('/api/customers/'.$row['id'], $this->customer(['name' => 'Tên cũ', 'version' => 1]))->assertConflict();
        $this->deleteJson('/api/customers/'.$row['id'], ['version' => 1])->assertConflict();
        $this->deleteJson('/api/customers/'.$row['id'], ['version' => 2])->assertOk();
        $this->getJson('/api/customers/'.$row['id'])->assertNotFound();
        $this->getJson('/api/customers')->assertJsonPath('meta.total', 0);
        $this->assertSoftDeleted('customers', ['id' => $row['id'], 'name' => 'Tên mới']);
    }

    public function test_broker_cannot_access_modify_or_reassign_another_brokers_customer(): void
    {
        $broker = $this->manager(2);
        $other = $this->manager(2);
        $this->actingAs($broker);
        $own = $this->postJson('/api/customers', $this->customer())->assertCreated()->json('data');
        $this->postJson('/api/customers', $this->customer(['assigned_to' => $other->id]))->assertForbidden();
        $this->actingAs($other);
        $foreign = $this->postJson('/api/customers', $this->customer())->json('data');
        $this->getJson('/api/customers')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $foreign['id']);
        $this->getJson('/api/customers/'.$own['id'])->assertNotFound();
        $this->putJson('/api/customers/'.$own['id'], $this->customer(['version' => 1]))->assertNotFound();
        $this->deleteJson('/api/customers/'.$own['id'], ['version' => 1])->assertNotFound();
        $this->postJson('/api/customers/'.$own['id'].'/interactions', [])->assertNotFound();
        $this->postJson('/api/customers/'.$own['id'].'/activities', [])->assertNotFound();
        $this->patchJson('/api/customers/'.$own['id'].'/activities/1/complete')->assertNotFound();
        $this->patchJson('/api/customers/'.$own['id'].'/activities/1', [])->assertNotFound();
        $this->patchJson('/api/customers/'.$own['id'].'/activities/1/cancel', [])->assertNotFound();
        $this->putJson('/api/customers/'.$foreign['id'], $this->customer(['version' => 1, 'assigned_to' => $broker->id]))->assertForbidden();
        $this->getJson('/api/customers/options')->assertJsonCount(1, 'assignees')->assertJsonPath('can_assign', false);
    }

    public function test_timeline_next_activity_timezone_completion_and_soft_delete_keep_history_consistent(): void
    {
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-19T05:00:00Z'));
        $this->actingAs($this->manager());
        $id = $this->postJson('/api/customers', $this->customer())->json('data.id');
        $this->postJson("/api/customers/$id/interactions", ['type' => 'call', 'summary' => 'Mới nhất', 'occurred_at' => '2026-10-19T11:00:00+07:00'])->assertCreated();
        $this->postJson("/api/customers/$id/interactions", ['type' => 'email', 'summary' => 'Nhập bổ sung lịch sử cũ', 'occurred_at' => '2026-10-18T11:00:00+07:00'])->assertCreated();
        $this->postJson("/api/customers/$id/activities", ['type' => 'meeting', 'title' => 'Xem nhà ngày mai', 'scheduled_at' => '2026-10-20T09:00:00+07:00'])->assertCreated();
        $activity = $this->postJson("/api/customers/$id/activities", ['type' => 'call', 'title' => 'Gọi lại hôm nay', 'scheduled_at' => '2026-10-19T15:00:00+07:00'])->assertCreated()->json('data');
        $this->getJson('/api/customers?care=today')->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.last_interaction.summary', 'Mới nhất')->assertJsonPath('data.0.next_activity.id', $activity['id']);
        $this->getJson("/api/customers/$id")->assertJsonPath('interactions.data.0.occurred_at', '2026-10-19T04:00:00.000000Z');
        $this->travel(4)->hours();
        $this->getJson('/api/customers?care=overdue')->assertJsonPath('meta.total', 1);
        $this->patchJson("/api/customers/$id/activities/{$activity['id']}/complete", ['version' => Customer::find($id)->version])->assertOk();
        $this->patchJson("/api/customers/$id/activities/{$activity['id']}/complete")->assertOk();
        $this->getJson("/api/customers/$id")->assertJsonPath('interactions.total', 3)
            ->assertJsonPath('data.last_interaction.summary', 'Gọi lại hôm nay')->assertJsonPath('data.next_activity.title', 'Xem nhà ngày mai');
        $other = $this->postJson('/api/customers', $this->customer())->json('data.id');
        $this->patchJson("/api/customers/$other/activities/{$activity['id']}/complete")->assertNotFound();
        $version = Customer::find($id)->version;
        $this->deleteJson("/api/customers/$id", ['version' => $version])->assertOk();
        $this->assertDatabaseCount('customer_interactions', 3);
        $this->getJson("/api/customers/$id")->assertNotFound();
    }

    public function test_validation_limits_and_no_future_history_or_past_followup(): void
    {
        $this->actingAs($this->manager());
        foreach ([['name' => str_repeat('ệ', 251)], ['company' => str_repeat('a', 251)], ['notes' => str_repeat('a', 251)], ['phone' => '090abc1234'], ['phone' => '123456789012'], ['email' => 'invalid'], ['status' => 'admin']] as $override) {
            $this->postJson('/api/customers', $this->customer($override))->assertUnprocessable()->assertJsonValidationErrors(array_keys($override));
        }
        $id = $this->postJson('/api/customers', $this->customer(['name' => str_repeat('ệ', 250)]))->assertCreated()->json('data.id');
        $this->postJson("/api/customers/$id/interactions", ['type' => 'call', 'summary' => 'Test', 'occurred_at' => now()->addDay()->toIso8601String()])->assertUnprocessable();
        $this->postJson("/api/customers/$id/activities", ['type' => 'call', 'title' => 'Test', 'scheduled_at' => now()->subDay()->toIso8601String()])->assertUnprocessable();
        $this->getJson('/api/customers?per_page=1000')->assertUnprocessable();
    }

    public function test_plans_can_be_rescheduled_or_cancelled_without_creating_false_interactions(): void
    {
        $this->actingAs($this->manager());
        $id = $this->postJson('/api/customers', $this->customer())->json('data.id');
        $plan = ['type' => 'call', 'title' => 'Gọi lại', 'scheduled_at' => now()->addDay()->toIso8601String()];
        $first = $this->postJson("/api/customers/$id/activities", $plan)->assertCreated()->json('data.id');
        $second = $this->postJson("/api/customers/$id/activities", array_merge($plan, ['scheduled_at' => now()->addDays(2)->toIso8601String()]))->json('data.id');
        $newPlan = array_merge($plan, ['version' => 3, 'scheduled_at' => now()->addDays(3)->toIso8601String()]);
        $this->patchJson("/api/customers/$id/activities/$first", $newPlan)->assertOk();
        $this->patchJson("/api/customers/$id/activities/$first", $newPlan)->assertConflict();
        $this->getJson("/api/customers/$id")->assertJsonPath('data.next_activity.id', $second);
        $this->patchJson("/api/customers/$id/activities/$second/cancel", ['version' => 4])->assertOk();
        $this->patchJson("/api/customers/$id/activities/$second/complete")->assertUnprocessable();
        $this->getJson("/api/customers/$id")->assertJsonPath('data.next_activity.id', $first)->assertJsonPath('interactions.total', 0);
        $this->patchJson("/api/customers/$id/activities/$first/complete", ['version' => Customer::find($id)->version])->assertOk();
        $this->getJson("/api/customers/$id")->assertJsonPath('data.next_activity', null)->assertJsonPath('interactions.total', 1);
        $this->patchJson("/api/customers/$id/activities/$first", array_merge($newPlan, ['version' => 6]))->assertUnprocessable();
        $this->patchJson("/api/customers/$id/activities/$first/cancel", ['version' => 6])->assertUnprocessable();
    }

    public function test_bearer_token_and_history_pagination_are_supported(): void
    {
        $broker = $this->manager(2);
        $token = $broker->createToken('crm-test')->plainTextToken;
        $this->withToken($token);
        $id = $this->postJson('/api/customers', $this->customer())->assertCreated()->json('data.id');
        for ($i = 0; $i < 10; $i++) {
            $this->postJson("/api/customers/$id/interactions", ['type' => 'note', 'summary' => 'Ghi chú '.$i, 'occurred_at' => now()->subMinutes($i)->toIso8601String()])->assertCreated();
        }
        $this->getJson("/api/customers/$id?history_page=2")->assertOk()->assertJsonPath('interactions.total', 10)
            ->assertJsonCount(2, 'interactions.data')->assertJsonPath('interactions.data.0.summary', 'Ghi chú 8');
    }

    public function test_removing_tracking_preserves_the_customer_and_history_and_can_be_reenabled(): void
    {
        $this->actingAs($owner = $this->manager(2));
        $id = $this->postJson('/api/customers', $this->customer())->json('data.id');
        $this->postJson("/api/customers/$id/interactions", ['type' => 'call', 'summary' => 'Đã trao đổi', 'occurred_at' => now()->subMinute()->toIso8601String()])->assertCreated();
        $this->actingAs($this->manager(2))->deleteJson("/api/customers/$id/tracking", ['version' => 2])->assertNotFound();
        $this->actingAs($owner)->deleteJson("/api/customers/$id/tracking", ['version' => 2])->assertOk();
        $this->getJson('/api/customers?view=tracking')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/customers?view=management')->assertJsonPath('meta.total', 1);
        $this->getJson("/api/customers/$id")->assertJsonPath('data.is_tracked', false)->assertJsonPath('interactions.total', 1);
        $this->putJson("/api/customers/$id", $this->customer(['version' => 3, 'is_tracked' => true]))->assertOk();
        $this->getJson('/api/customers?view=tracking')->assertJsonPath('meta.total', 1);
        $this->deleteJson("/api/customers/$id", ['version' => 4])->assertOk();
        $this->getJson('/api/customers?view=management')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/customers?view=tracking')->assertJsonPath('meta.total', 0);
    }

    public function test_customer_seeder_imports_project_contacts_and_is_safe_to_repeat(): void
    {
        $this->manager();
        $broker = $this->manager(2);
        $account = $this->manager(5);
        $brokerRecord = \App\Models\Broker::create(['code' => 'MG-SEED', 'name' => $broker->name, 'user_id' => $broker->id, 'status' => 'active']);
        \App\Models\BrokerAssignment::create(['request_code' => 'YC-SEED', 'customer_name' => 'Khách từ phân công', 'customer_email' => 'lead@example.com', 'customer_phone' => '0912345678', 'property_location' => 'Thủ Đức', 'broker_id' => $brokerRecord->id, 'assigned_date' => today(), 'status' => 'in_progress']);
        $userCount = User::count();
        $this->seed(\Database\Seeders\CustomerSeeder::class);
        $this->assertDatabaseHas('customers', ['seed_key' => 'user:'.$account->id, 'name' => $account->name]);
        $this->assertDatabaseHas('customers', ['email' => 'lead@example.com', 'assigned_to' => $broker->id]);
        $this->assertDatabaseHas('customers', ['name' => 'Phạm Văn E', 'company' => 'Cty MNO']);
        $seeded = Customer::where('seed_key', 'reference:le-thi-c')->firstOrFail();
        $this->assertSame(1, $seeded->interactions()->count());
        $this->assertSame(1, $seeded->activities()->count());
        $seeded->update(['email' => 'edited@example.com', 'name' => 'Tên đã sửa', 'is_tracked' => false]);
        $deleted = Customer::where('seed_key', 'reference:pham-van-e')->firstOrFail();
        $deleted->delete();
        $count = Customer::withTrashed()->count();
        $this->seed(\Database\Seeders\CustomerSeeder::class);
        $this->assertSame($count, Customer::withTrashed()->count());
        $this->assertSame($userCount, User::count());
        $this->assertDatabaseHas('customers', ['id' => $seeded->id, 'name' => 'Tên đã sửa', 'email' => 'edited@example.com', 'is_tracked' => false]);
        $this->assertSoftDeleted('customers', ['id' => $deleted->id]);
        $this->assertSame(1, $seeded->interactions()->count());
        $this->assertSame(1, $seeded->activities()->count());
    }
}
