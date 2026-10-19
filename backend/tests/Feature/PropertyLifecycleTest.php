<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $roleId): User
    {
        if (!Role::find($roleId)) Role::forceCreate(['id' => $roleId, 'name' => $roleId === 1 ? 'Admin' : 'Customer']);
        return User::create(['name' => 'Tester', 'email' => uniqid().'@example.com', 'password' => 'test-password', 'role_id' => $roleId, 'is_active' => true]);
    }

    private function payload(): array
    {
        return ['title' => 'Test BĐS Biệt Thự Thảo Điền Quận 2', 'purpose' => 'sale', 'type' => 'Biệt thự đơn lập', 'price' => 25000000000, 'area' => 300, 'bedrooms' => 4, 'address' => '12 Nguyễn Văn Hưởng'];
    }

    public function test_create_edit_search_delete_restore_and_permanent_delete(): void
    {
        $this->actingAs($this->user(1));
        $response = $this->postJson('/api/properties', $this->payload())->assertCreated();
        $id = $response->json('data.id');
        $this->getJson('/api/properties')->assertJsonPath('0.title', $this->payload()['title'])->assertJsonPath('0.price_sale_text', '25 tỷ');
        $this->getJson('/api/properties?admin=1&search=Test')->assertJsonPath('meta.total', 1);
        $this->putJson('/api/properties/'.$id, ['price' => 26000000000])->assertOk()->assertJsonPath('data.price_sale_text', '26 tỷ');
        $this->deleteJson('/api/properties/'.$id.'/force')->assertStatus(422);
        $this->deleteJson('/api/properties/'.$id)->assertOk();
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->getJson('/api/properties/trash')->assertJsonPath('meta.total', 1);
        $this->patchJson('/api/properties/'.$id.'/restore')->assertOk();
        $this->getJson('/api/properties')->assertJsonCount(1);
        $this->deleteJson('/api/properties/'.$id)->assertOk();
        $this->deleteJson('/api/properties/'.$id.'/force')->assertOk();
        $this->assertDatabaseMissing('properties', ['id' => $id]);
    }

    public function test_property_title_accepts_255_characters_and_rejects_256_on_create_and_update(): void
    {
        $this->actingAs($this->user(1));
        $title = str_repeat('đ', 255);
        $id = $this->postJson('/api/properties', array_merge($this->payload(), ['title' => $title]))
            ->assertCreated()->json('data.id');
        $tooLong = $title.'đ';
        $this->postJson('/api/properties', array_merge($this->payload(), ['title' => $tooLong]))
            ->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->putJson('/api/properties/'.$id, ['title' => $tooLong])
            ->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->assertDatabaseHas('properties', ['id' => $id, 'title' => $title]);
    }

    public function test_category_and_broker_pages_load_and_broker_sync_is_repeatable(): void
    {
        $this->actingAs($this->user(1));
        $this->getJson('/api/categories')->assertOk()->assertJsonPath('summary.total', 8);
        $brokerUser = $this->user(2);
        $this->artisan('brokers:sync-users')->assertSuccessful();
        $this->artisan('brokers:sync-users')->assertSuccessful();
        $this->getJson('/api/brokers')->assertOk()->assertJsonPath('summary.total', 1);
        $this->assertDatabaseHas('brokers', ['user_id' => $brokerUser->id]);
        $this->getJson('/api/broker-assignments')->assertOk();
    }

    public function test_pending_hidden_expired_and_deleted_listings_are_not_public(): void
    {
        $customer = $this->user(5);
        $this->actingAs($customer);
        $created = $this->postJson('/api/properties', $this->payload())->assertCreated()->assertJsonPath('data.status', 0);
        $id = $created->json('data.id');
        $this->getJson('/api/properties?all=true&user_id=99999')->assertJsonCount(1)->assertJsonPath('0.id', $id);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->patchJson('/api/properties/'.$id.'/status', ['status' => 1])->assertForbidden();
        $this->actingAs($this->user(1));
        $this->patchJson('/api/properties/'.$id.'/status', ['status' => 1])->assertOk();
        $this->getJson('/api/properties')->assertJsonCount(1);
        $this->patchJson('/api/properties/'.$id.'/status', ['status' => 4])->assertOk()->assertJsonPath('data.status', 4);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->postJson('/api/properties/'.$id.'/extend', ['days' => 30])->assertOk()->assertJsonPath('data.status', 4);
        $this->getJson('/api/properties/'.$id.'/status-history')->assertJsonCount(2, 'data');
        $this->getJson('/api/properties/'.$id.'/extension-history')->assertJsonCount(1, 'data');
        Property::find($id)->update(['status' => 1, 'expire_date' => now()->subDay()]);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->getJson('/api/properties?admin=1&status=3')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.status', 3);
        $this->getJson('/api/properties?admin=1&status=1')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/properties/stats')->assertJsonPath('active', 0)->assertJsonPath('expired', 1);
        $this->postJson('/api/properties/'.$id.'/extend', ['days' => -1])->assertStatus(422);
        $this->postJson('/api/properties/'.$id.'/extend', ['days' => 30])->assertOk();
        $this->getJson('/api/properties')->assertJsonCount(1);
    }

    public function test_validation_ownership_and_atomic_bulk_actions(): void
    {
        $this->postJson('/api/properties', $this->payload())->assertUnauthorized();
        $owner = $this->user(5);
        $this->actingAs($owner);
        $this->postJson('/api/properties', array_merge($this->payload(), ['area' => -1]))->assertStatus(422);
        $id = $this->postJson('/api/properties', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($this->user(5));
        $this->getJson('/api/properties?all=true&user_id='.$owner->id)->assertExactJson([]);
        $this->putJson('/api/properties/'.$id, ['price' => 1])->assertForbidden();
        $this->deleteJson('/api/properties/'.$id)->assertForbidden();
        $this->actingAs($this->user(1));
        $this->postJson('/api/properties/bulk-action', ['ids' => [$id, 999999], 'action' => 'delete'])->assertNotFound();
        $this->assertNull(Property::find($id)->deleted_at);
        $this->postJson('/api/properties/bulk-action', ['ids' => [$id], 'action' => 'approve'])->assertOk();
        $this->getJson('/api/properties')->assertJsonCount(1);
        $this->postJson('/api/properties/bulk-action', ['ids' => [$id], 'action' => 'delete'])->assertOk();
        $this->getJson('/api/properties')->assertExactJson([]);
    }

    public function test_property_types_are_persisted_and_cannot_form_cycles_or_lose_referenced_properties(): void
    {
        $this->actingAs($this->user(1));
        $parent = $this->postJson('/api/property-types', ['name' => 'Biệt thự', 'slug' => 'biet-thu', 'status' => 1])->assertCreated()->json('data.id');
        $child = $this->postJson('/api/property-types', ['name' => 'Biệt thự đơn lập', 'slug' => 'biet-thu-don-lap', 'parent_id' => $parent, 'status' => 1])->assertCreated()->json('data.id');
        $this->getJson('/api/property-types')->assertJsonPath('data.1.parent_name', 'Biệt thự');
        $this->putJson('/api/property-types/'.$parent, ['name' => 'Biệt thự', 'slug' => 'biet-thu', 'parent_id' => $child, 'status' => 1])->assertStatus(422);
        $this->deleteJson('/api/property-types/'.$parent)->assertStatus(422);
        $property = $this->postJson('/api/properties', array_merge($this->payload(), ['property_type_id' => $child]))->assertCreated()->json('data.id');
        $this->deleteJson('/api/property-types/'.$child)->assertStatus(422);
        $this->putJson('/api/property-types/'.$child, ['name' => 'Villa đơn lập', 'slug' => 'villa-don-lap', 'status' => 1])->assertOk();
        $this->assertDatabaseHas('properties', ['id' => $property, 'type' => 'Villa đơn lập']);
        $this->postJson('/api/property-types', ['name' => 'Trùng', 'slug' => 'villa-don-lap', 'status' => 1])->assertStatus(422);
    }

    public function test_history_records_one_entry_per_property_and_deletes_exactly_that_entry(): void
    {
        $this->actingAs($this->user(1));
        $this->postJson('/api/history', ['property' => ['code' => 'MISSING']])->assertNotFound();
        $property = $this->postJson('/api/properties', $this->payload())->assertCreated()->json('data');
        $second = $this->postJson('/api/properties', $this->payload())->assertCreated()->json('data');
        $this->postJson('/api/history', ['property' => $property])->assertOk();
        $this->postJson('/api/history', ['property' => $property])->assertOk();
        $this->postJson('/api/history', ['property' => $second])->assertOk();
        $this->getJson('/api/history')->assertJsonCount(2);
        $this->deleteJson('/api/history', ['code' => $property['code']])->assertOk();
        $this->getJson('/api/history')->assertJsonCount(1)->assertJsonPath('0.property_data.code', $second['code']);
        $this->deleteJson('/api/history')->assertOk();
        $this->getJson('/api/history')->assertExactJson([]);
    }

    public function test_database_button_does_not_reset_properties_or_reseed_accounts(): void
    {
        $this->getJson('/api/run-migrate')->assertUnauthorized();
        $this->actingAs($this->user(5))->getJson('/api/run-migrate')->assertForbidden();
        $this->actingAs($this->user(1));
        $id = $this->postJson('/api/properties', $this->payload())->json('data.id');
        \Illuminate\Support\Facades\Artisan::shouldReceive('call')->once()->with('migrate', ['--force' => true])->andReturn(0);
        \Illuminate\Support\Facades\Artisan::shouldReceive('output')->once()->andReturn('Nothing to migrate.');
        $this->getJson('/api/run-migrate')->assertOk();
        $this->assertDatabaseHas('properties', ['id' => $id]);
    }

    public function test_invalid_numeric_and_long_address_inputs_report_validation_instead_of_login_errors(): void
    {
        foreach (['price', 'area'] as $field) {
            $this->putJson('/api/properties/22', [$field => str_repeat('1', 21)])->assertStatus(422)
                ->assertJsonPath('errors.'.$field.'.0', 'Mức giá bạn muốn bán đã nhiều hơn tài sản của tỉ phú Elon Musk');
        }
        foreach ([['price' => '1e6'], ['area' => '3e555'], ['price' => str_repeat('9', 40)], ['area' => str_repeat('9', 40)], ['address' => str_repeat('Đ', 256)], ['area' => '12.345']] as $invalid) {
            $field = array_key_first($invalid);
            $this->putJson('/api/properties/22', $invalid)->assertStatus(422)->assertJsonValidationErrors($field);
            $this->postJson('/api/properties', array_merge($this->payload(), $invalid))->assertStatus(422)->assertJsonValidationErrors($field);
        }
        $this->actingAs($this->user(1));
        $this->postJson('/api/properties', array_merge($this->payload(), ['price' => '25000000000.00', 'area' => '300.25', 'address' => str_repeat('Đ', 255)]))->assertCreated();
    }

    public function test_quick_hide_and_bulk_hide_need_no_reason_and_can_be_reversed(): void
    {
        $this->actingAs($this->user(1));
        $id = $this->postJson('/api/properties', $this->payload())->assertCreated()->json('data.id');
        $this->postJson('/api/history', ['property' => ['code' => Property::find($id)->code]])->assertOk();
        $this->getJson('/api/history')->assertJsonCount(1);
        $this->patchJson('/api/properties/'.$id.'/status', ['status' => 4])->assertOk()->assertJsonPath('data.status', 4);
        $this->getJson('/api/history')->assertExactJson([]);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->getJson('/api/properties/stats')->assertJsonPath('hidden', 1)->assertJsonPath('active', 0);
        $this->getJson('/api/properties/'.$id.'/status-history')->assertJsonPath('data.0.reason', 'Tạm ẩn bài đăng.');
        $this->patchJson('/api/properties/'.$id.'/status', ['status' => 1])->assertOk();
        $this->getJson('/api/history')->assertJsonCount(1);
        $this->getJson('/api/properties')->assertJsonCount(1);
        $this->postJson('/api/properties/bulk-action', ['action' => 'hide', 'ids' => [$id]])->assertOk();
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->postJson('/api/properties/bulk-action', ['action' => 'show', 'ids' => [$id]])->assertOk();
        $this->getJson('/api/properties')->assertJsonCount(1);
    }

    public function test_draft_status_edits_and_blank_image_match_the_form_behavior(): void
    {
        $this->actingAs($this->user(1));
        $image = 'https://example.com/villa.jpg';
        $id = $this->postJson('/api/properties', array_merge($this->payload(), ['status' => 0, 'image' => $image]))->assertCreated()->assertJsonPath('data.status', 0)->json('data.id');
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->putJson('/api/properties/'.$id, ['status' => '1', 'image' => ''])->assertOk()->assertJsonPath('data.status', 1)->assertJsonPath('data.image', $image);
        $this->getJson('/api/properties')->assertJsonCount(1);
        $this->putJson('/api/properties/'.$id, ['status' => '4'])->assertOk()->assertJsonPath('data.status', 4);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->getJson('/api/properties/'.$id.'/status-history')->assertJsonCount(2, 'data');
    }

    public function test_file_import_is_complete_idempotent_and_never_overwrites_database_changes(): void
    {
        $rows = json_decode(file_get_contents(database_path('data/all_properties.json')), true);
        $this->seed(\Database\Seeders\PropertySeeder::class);
        $this->assertSame(count($rows), Property::withTrashed()->count());
        $first = Property::where('code', $rows[0]['code'])->firstOrFail();
        $first->update(['title' => 'Đã sửa trong database', 'status' => 4, 'price' => 123456789]);
        $second = Property::where('code', $rows[1]['code'])->firstOrFail();
        $second->delete();
        $this->seed(\Database\Seeders\PropertySeeder::class);
        $this->assertSame(count($rows), Property::withTrashed()->count());
        $this->assertDatabaseHas('properties', ['id' => $first->id, 'title' => 'Đã sửa trong database', 'status' => 4, 'price' => 123456789]);
        $this->assertSoftDeleted('properties', ['id' => $second->id]);
        $this->artisan('properties:sync', ['--check' => true])->assertSuccessful();
    }

    public function test_api_reads_changes_made_directly_in_database_without_model_events(): void
    {
        $this->actingAs($this->user(1));
        $id = $this->postJson('/api/properties', $this->payload())->json('data.id');
        \Illuminate\Support\Facades\DB::table('properties')->where('id', $id)->update(['title' => 'Sửa trực tiếp từ database', 'price' => 123456789]);
        $this->getJson('/api/properties')->assertJsonPath('0.title', 'Sửa trực tiếp từ database')->assertJsonPath('0.price_sale_text', '123.46 triệu');
        $this->getJson('/api/properties?admin=1')->assertJsonPath('data.0.title', 'Sửa trực tiếp từ database');
        \Illuminate\Support\Facades\DB::table('properties')->where('id', $id)->update(['status' => 4]);
        $this->getJson('/api/properties')->assertExactJson([]);
        $this->getJson('/api/properties/stats')->assertJsonPath('hidden', 1);
    }

    public function test_new_property_resolves_sql_type_and_updates_the_category_count(): void
    {
        $this->actingAs($this->user(1));
        $type = \App\Models\PropertyType::create(['name' => 'Biệt thự đơn lập', 'slug' => 'biet-thu-don-lap', 'status' => 1]);
        $created = $this->postJson('/api/properties', $this->payload())->assertCreated()->assertJsonPath('data.property_type_id', $type->id);
        $this->assertDatabaseHas('properties', ['id' => $created->json('data.id'), 'property_type_id' => $type->id]);
        $this->getJson('/api/property-types')->assertJsonPath('data.0.properties_count', 1);
        $type->update(['status' => 0]);
        $this->postJson('/api/properties', $this->payload())->assertStatus(422)->assertJsonValidationErrors('type');
    }
}
