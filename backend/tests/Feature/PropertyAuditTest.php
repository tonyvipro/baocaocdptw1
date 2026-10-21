<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PropertyAuditTest extends TestCase
{
    use RefreshDatabase;

    private function actor(int $role = 1): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => 'Audit '.$role]);
        return User::create(['name' => 'Audit', 'email' => uniqid().'@example.test', 'password' => 'audit-password', 'role_id' => $role, 'is_active' => true]);
    }

    private function listing(array $data = []): Property
    {
        return Property::create(array_merge(['code' => 'AUDIT-'.uniqid(), 'title' => 'Biệt thự Thảo Điền', 'type' => 'Biệt thự', 'purpose' => 'sale', 'status' => 1, 'price' => 2e9, 'price_sale' => 2e9, 'area' => 80, 'expire_date' => now()->addDays(10)], $data));
    }

    public function test_management_cannot_be_read_by_anonymous_or_customer_and_broker_is_scoped(): void
    {
        $broker = $this->actor(2);
        $own = $this->listing(['user_id' => $broker->id, 'status' => 0]);
        $this->listing(['user_id' => $this->actor()->id, 'status' => 4]);
        $this->getJson('/api/properties?admin=1')->assertUnauthorized();
        $this->actingAs($this->actor(5))->getJson('/api/properties?admin=1')->assertForbidden();
        $this->actingAs($broker)->getJson('/api/properties?admin=1')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $own->id);
    }

    public function test_editing_title_does_not_overwrite_a_price_changed_directly_in_sql(): void
    {
        $this->actingAs($this->actor());
        $property = $this->listing();
        DB::table('properties')->where('id', $property->id)->update(['price' => 3e9]);
        $this->putJson('/api/properties/'.$property->id, ['title' => 'Tên đã sửa'])->assertOk()->assertJsonPath('data.price', 3000000000);
        $this->assertDatabaseHas('properties', ['id' => $property->id, 'price' => 3e9]);
    }

    public function test_update_rejects_blank_title_and_fields_exceeding_mysql_column_lengths(): void
    {
        $this->actingAs($this->actor());
        $property = $this->listing();
        foreach (['title' => '   ', 'district' => str_repeat('Đ', 101), 'city' => str_repeat('Đ', 101), 'direction' => str_repeat('Đ', 51), 'owner_phone' => str_repeat('1', 51), 'legal' => str_repeat('Đ', 101), 'deposit' => '10000000000000'] as $field => $value) {
            $this->putJson('/api/properties/'.$property->id, [$field => $value])->assertUnprocessable()->assertJsonValidationErrors($field);
        }
    }

    public function test_history_cannot_record_expired_listings_and_reflects_live_sql_data(): void
    {
        $this->actingAs($this->actor());
        $property = $this->listing();
        $this->postJson('/api/history', ['property' => ['code' => $property->code]])->assertOk();
        DB::table('properties')->where('id', $property->id)->update(['title' => 'Tên thay bằng SQL', 'price' => 3e9]);
        $this->getJson('/api/history')->assertOk()->assertJsonPath('0.property_data.title', 'Tên thay bằng SQL')->assertJsonPath('0.property_data.price_sale_text', '3 tỷ');
        DB::table('properties')->where('id', $property->id)->update(['expire_date' => now()->subMinute()]);
        $this->postJson('/api/history', ['property' => ['code' => $property->code]])->assertNotFound();
        $this->getJson('/api/history')->assertExactJson([]);
    }

    public function test_public_api_filters_numeric_ranges_and_sort_and_rejects_invalid_ranges(): void
    {
        $this->listing(['price' => 1e9, 'area' => 49]);
        $selected = $this->listing(['price' => 2e9, 'area' => 80]);
        $this->listing(['price' => 3e9, 'area' => 150]);
        $this->getJson('/api/properties?price_min=1500000000&price_max=2500000000&area_min=50&area_max=100')
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $selected->id);
        $this->getJson('/api/properties?sort=price-desc')->assertOk()->assertJsonPath('0.price', 3000000000);
        $this->getJson('/api/properties?price_min=10&price_max=1')->assertUnprocessable();
        $this->getJson('/api/properties?area_min[]=bad')->assertUnprocessable();
    }

    public function test_sql_renaming_property_type_keeps_search_and_filter_consistent_with_display(): void
    {
        $type = \App\Models\PropertyType::create(['name' => 'Biệt thự', 'slug' => 'villa', 'status' => 1]);
        $property = $this->listing(['property_type_id' => $type->id]);
        DB::table('property_types')->where('id', $type->id)->update(['name' => 'Villa ven sông']);
        $this->getJson('/api/properties?search=villa')->assertOk()->assertJsonCount(1)->assertJsonPath('0.type', 'Villa ven sông');
        $this->actingAs($this->actor())->getJson('/api/properties?admin=1&type='.urlencode('Villa ven sông'))->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_create_and_update_persist_description_amenities_and_build_year(): void
    {
        $this->actingAs($this->actor());
        $data = ['title' => 'Tin có tiện ích thật', 'purpose' => 'sale', 'type' => 'Biệt thự', 'price' => 1e9, 'area' => 100,
            'description' => 'Mô tả thật', 'amenities' => ['Hồ bơi', 'Sân vườn'], 'build_year' => 2020];
        $id = $this->postJson('/api/properties', $data)->assertCreated()->json('data.id');
        $this->assertDatabaseHas('properties', ['id' => $id, 'description' => 'Mô tả thật', 'build_year' => 2020]);
        $this->assertSame(['Hồ bơi', 'Sân vườn'], json_decode(Property::find($id)->amenities, true));
        $this->putJson('/api/properties/'.$id, ['amenities' => ['Sân tennis'], 'build_year' => 2021])->assertOk();
        $this->assertSame(['Sân tennis'], json_decode(Property::find($id)->amenities, true));
        $this->postJson('/api/properties', array_merge($data, ['amenities' => [str_repeat('x', 251)]]))->assertUnprocessable();
    }
}
