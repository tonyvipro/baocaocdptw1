<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\PropertyType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDemandTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $role = 1): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);
        return User::create(['name' => 'Nhân viên', 'email' => uniqid().'@example.com', 'password' => 'test-password', 'role_id' => $role, 'is_active' => true]);
    }

    private function customer(User $owner): Customer
    {
        return Customer::create(['name' => 'Trần Văn A', 'email' => uniqid().'@example.com', 'phone' => '0901234567',
            'company' => 'Cty MNO', 'assigned_to' => $owner->id, 'customer_group' => 'new', 'status' => 'new']);
    }

    private function payload(Customer $customer, array $changes = []): array
    {
        $type = PropertyType::firstOrCreate(['slug' => 'can-ho'], ['name' => 'Căn hộ', 'status' => 1]);
        return array_merge(['customer_id' => $customer->id, 'property_type_id' => $type->id, 'budget_min' => '4000000000',
            'budget_max' => '5000000000', 'area' => 'Quận 1, TP.HCM', 'status' => 'processing', 'notes' => 'Gần trường học'], $changes);
    }

    public function test_only_actual_active_admin_or_broker_can_access_demands(): void
    {
        $admin = $this->user();
        $this->getJson('/api/demands?user_id='.$admin->id)->assertUnauthorized();
        $this->getJson('/api/demands/options')->assertUnauthorized();
        $this->getJson('/api/demands/1')->assertUnauthorized();
        $this->postJson('/api/demands')->assertUnauthorized();
        $this->putJson('/api/demands/1')->assertUnauthorized();
        $this->deleteJson('/api/demands/1')->assertUnauthorized();
        $this->actingAs($this->user(5))->getJson('/api/demands')->assertForbidden();
        $admin->update(['is_active' => false]);
        $this->actingAs($admin)->getJson('/api/demands')->assertUnauthorized();
    }

    public function test_admin_crud_keeps_customer_and_audit_log_and_detects_stale_versions(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);
        $payload = $this->payload($customer);
        $row = $this->postJson('/api/demands', $payload + ['created_by' => 999, 'version' => 99])->assertCreated()
            ->assertJsonPath('data.version', 1)->assertJsonPath('data.customer.name', $customer->name)->json('data');
        $this->assertSame('ND-1001', $row['code']);
        $this->assertDatabaseHas('customer_demands', ['id' => $row['id'], 'created_by' => $admin->id]);
        $this->getJson('/api/demands/'.$row['id'])->assertOk()->assertJsonPath('data.property_type.name', 'Căn hộ');
        $this->putJson('/api/demands/'.$row['id'], $payload + ['version' => 1])->assertOk()->assertJsonPath('data.version', 2);
        $this->putJson('/api/demands/'.$row['id'], $payload + ['version' => 1])->assertConflict();
        $this->deleteJson('/api/demands/'.$row['id'], ['version' => 1])->assertConflict();
        $this->deleteJson('/api/demands/'.$row['id'], ['version' => 2])->assertOk();
        $this->getJson('/api/demands/'.$row['id'])->assertNotFound();
        $this->getJson('/api/demands')->assertJsonPath('meta.total', 0);
        $this->assertSoftDeleted('customer_demands', ['id' => $row['id']]);
        $this->assertNotSoftDeleted('customers', ['id' => $customer->id]);
        foreach (['DEMAND_CREATE', 'DEMAND_UPDATE', 'DEMAND_DELETE'] as $action) $this->assertDatabaseHas('activity_logs', ['user_id' => $admin->id, 'action' => $action, 'record_id' => $row['id']]);
        $this->getJson('/api/notifications')->assertJsonPath('logs.data.0.action', 'Xóa nhu cầu');
    }

    public function test_search_combined_filters_budget_overlap_and_pagination(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);
        $first = $this->postJson('/api/demands', $this->payload($customer))->assertCreated()->json('data');
        $otherType = PropertyType::create(['name' => 'Nhà phố', 'slug' => 'nha-pho', 'status' => 1]);
        $this->postJson('/api/demands', $this->payload($customer, ['property_type_id' => $otherType->id, 'budget_min' => '0', 'budget_max' => '1000000000', 'area' => 'Đà Nẵng', 'status' => 'completed', 'notes' => 'Có sân vườn']))->assertCreated();
        $this->getJson('/api/demands?per_page=1')->assertJsonPath('meta.total', 2)->assertJsonPath('meta.last_page', 2)->assertJsonCount(1, 'data');
        $this->getJson('/api/demands?per_page=1&page=2')->assertJsonPath('data.0.id', $first['id']);
        foreach ([$first['code'], 'Quận 1', 'Căn hộ', 'Gần trường'] as $keyword) {
            $response = $this->getJson('/api/demands?'.http_build_query(['search' => $keyword]))->assertOk();
            $this->assertSame(1, $response->json('meta.total'), 'Search: '.$keyword);
            $response->assertJsonPath('data.0.id', $first['id']);
        }
        $this->getJson('/api/demands?search=MNO')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/demands?'.http_build_query(['property_type_id' => $first['property_type_id'], 'budget_min' => '5000000000', 'budget_max' => '6000000000', 'area' => 'Quận 1', 'status' => 'processing']))->assertJsonPath('meta.total', 1);
        $this->getJson('/api/demands?budget_min=5000000001')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/demands?budget_max=0')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/demands?status=cancelled')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/demands?budget_min=2&budget_max=1')->assertUnprocessable();
        $this->getJson('/api/demands?search='.str_repeat('a', 251))->assertUnprocessable();
    }

    public function test_brokers_only_manage_demands_for_their_assigned_customers_and_reassignment_takes_effect(): void
    {
        $broker = $this->user(2);
        $other = $this->user(2);
        $own = $this->customer($broker);
        $foreign = $this->customer($other);
        $this->actingAs($broker);
        $row = $this->postJson('/api/demands', $this->payload($own))->assertCreated()->json('data');
        $this->postJson('/api/demands', $this->payload($foreign))->assertUnprocessable()->assertJsonValidationErrors('customer_id');
        $this->putJson('/api/demands/'.$row['id'], $this->payload($foreign) + ['version' => 1])->assertUnprocessable();
        $this->actingAs($other)->getJson('/api/demands')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/demands/'.$row['id'])->assertNotFound();
        $this->putJson('/api/demands/'.$row['id'], $this->payload($own) + ['version' => 1])->assertNotFound();
        $this->deleteJson('/api/demands/'.$row['id'], ['version' => 1])->assertNotFound();
        $own->update(['assigned_to' => $other->id]);
        $this->getJson('/api/demands')->assertJsonPath('meta.total', 1);
        $this->actingAs($broker)->getJson('/api/demands/'.$row['id'])->assertNotFound();
        $this->actingAs($other);
        $this->putJson('/api/demands/'.$row['id'], $this->payload($own) + ['version' => 1])->assertOk();
        $own->delete();
        $this->getJson('/api/demands')->assertJsonPath('meta.total', 0);
    }

    public function test_validation_rejects_invalid_budgets_overlong_fields_deleted_customers_and_inactive_types(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);
        $payload = $this->payload($customer);
        foreach (['-1', '1e9', '1.5', 'abc', '1000000000000000'] as $money) $this->postJson('/api/demands', array_replace($payload, ['budget_min' => $money]))->assertUnprocessable()->assertJsonValidationErrors('budget_min');
        $this->postJson('/api/demands', array_replace($payload, ['budget_min' => '6000000000']))->assertUnprocessable()->assertJsonValidationErrors('budget_max');
        foreach (['area', 'notes'] as $field) $this->postJson('/api/demands', array_replace($payload, [$field => str_repeat('đ', 251)]))->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->postJson('/api/demands', array_replace($payload, ['status' => 'unknown']))->assertUnprocessable();
        $this->postJson('/api/demands', array_replace($payload, ['area' => str_repeat('đ', 250), 'notes' => str_repeat('a', 250), 'budget_min' => '0', 'budget_max' => '999999999999999']))->assertCreated();
        PropertyType::find($payload['property_type_id'])->update(['status' => 0]);
        $this->postJson('/api/demands', $payload)->assertUnprocessable()->assertJsonValidationErrors('property_type_id');
        $this->putJson('/api/demands/1', $payload + ['version' => 1])->assertOk();
        $this->deleteJson('/api/property-types/'.$payload['property_type_id'])->assertUnprocessable();
        $customer->delete();
        $this->postJson('/api/demands', $payload)->assertUnprocessable()->assertJsonValidationErrors('customer_id');
    }

    public function test_bearer_token_support_and_options_are_database_backed(): void
    {
        $broker = $this->user(2);
        $customer = $this->customer($broker);
        $payload = $this->payload($customer);
        $token = $broker->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/demands/options')->assertOk()->assertJsonPath('property_types.0.name', 'Căn hộ')->assertJsonPath('statuses.processing', 'Đang xử lý');
        $this->withToken($token)->postJson('/api/demands', $payload)->assertCreated();
        $this->withToken($token)->getJson('/api/demands')->assertJsonPath('meta.total', 1);
        $this->withToken($token)->deleteJson('/api/demands/1', ['version' => 1])->assertOk();
    }

    public function test_pending_migration_returns_a_clear_error_and_does_not_break_property_types(): void
    {
        $this->actingAs($this->user());
        \Illuminate\Support\Facades\Schema::drop('customer_demands');
        $this->getJson('/api/demands')->assertStatus(503)->assertJsonPath('message', 'Chức năng nhu cầu chưa được khởi tạo. Vui lòng chạy migration bổ sung cho bảng customer_demands.');
        $type = PropertyType::create(['name' => 'Loại mới', 'slug' => 'loai-moi', 'status' => 1]);
        $this->deleteJson('/api/property-types/'.$type->id)->assertOk();
    }

    public function test_missing_property_type_status_reports_the_required_migration(): void
    {
        $this->actingAs($this->user());
        \Illuminate\Support\Facades\Schema::table('property_types', fn ($table) => $table->dropColumn('status'));
        $this->getJson('/api/demands/options')->assertStatus(503)->assertJsonPath('message', 'Danh mục loại BĐS chưa được cập nhật. Vui lòng chạy migration bổ sung cho property_types.');
    }
}
