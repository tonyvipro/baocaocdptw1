<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\District;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\Province;
use App\Models\Role;
use App\Models\User;
use App\Models\Ward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDemandMatchingTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $role = 1): User
    {
        if (!Role::find($role)) {
            Role::forceCreate(['id' => $role, 'name' => 'Role ' . $role]);
        }
        return User::create([
            'name' => 'Nhân viên ' . uniqid(),
            'email' => uniqid() . '@example.com',
            'password' => 'test-password',
            'role_id' => $role,
            'is_active' => true,
        ]);
    }

    private function customer(User $owner): Customer
    {
        return Customer::create([
            'name' => 'Nguyễn Văn Khách Hàng',
            'email' => uniqid() . '@example.com',
            'phone' => '0912345678',
            'company' => 'Công ty BĐS',
            'assigned_to' => $owner->id,
            'customer_group' => 'vip',
            'status' => 'interested',
        ]);
    }

    /**
     * 1. Test một khách hàng hasMany nhiều nhu cầu và ngân sách là số nguyên VNĐ
     */
    public function test_customer_has_many_demands_with_integer_vnd_budgets(): void
    {
        $admin = $this->user();
        $customer = $this->customer($admin);

        $cat = Category::create([
            'name' => 'Căn hộ chung cư',
            'slug' => 'can-ho-chung-cu',
            'status' => 'active',
        ]);

        $demand1 = CustomerDemand::create([
            'customer_id' => $customer->id,
            'category_id' => $cat->id,
            'budget_min' => 2000000000, // 2 tỷ VNĐ
            'budget_max' => 3500000000, // 3.5 tỷ VNĐ
            'area' => 'Quận 1',
            'status' => 'processing',
        ]);

        $demand2 = CustomerDemand::create([
            'customer_id' => $customer->id,
            'category_id' => $cat->id,
            'budget_min' => 5000000000, // 5 tỷ VNĐ
            'budget_max' => 8000000000, // 8 tỷ VNĐ
            'area' => 'Quận 7',
            'status' => 'consulting',
        ]);

        $customer->refresh();
        $this->assertCount(2, $customer->demands);
        $this->assertIsInt($demand1->budget_min);
        $this->assertIsInt($demand1->budget_max);
        $this->assertEquals(2000000000, $demand1->budget_min);
        $this->assertEquals(3500000000, $demand1->budget_max);
    }

    /**
     * 2. Test tạo nhu cầu với các trường có cấu trúc: category_id, khu vực (province/district/ward, location_ids JSON), số phòng
     */
    public function test_create_demand_with_structured_fields_and_optional_area_string(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);

        $cat = Category::create(['name' => 'Nhà phố liền kề', 'slug' => 'nha-pho-lien-ke', 'status' => 'active']);
        $province = Province::create(['name' => 'TP. Hồ Chí Minh']);
        $district = District::create(['province_id' => $province->id, 'name' => 'Quận Bình Thạnh']);
        $ward = Ward::create(['district_id' => $district->id, 'name' => 'Phường 25']);

        $payload = [
            'customer_id' => $customer->id,
            'category_id' => $cat->id,
            'province_id' => $province->id,
            'district_id' => $district->id,
            'ward_id' => $ward->id,
            'location_ids' => [$district->id, 999],
            'bedrooms' => 3,
            'bathrooms' => 2,
            'budget_min' => 4000000000,
            'budget_max' => 6000000000,
            'notes' => 'Cần nhà mới có sổ hồng riêng',
            'status' => 'processing',
        ];

        // Không truyền area chuỗi -> Hệ thống tự động ghép chuỗi area từ Ward, District, Province
        $res = $this->postJson('/api/demands', $payload);
        $res->assertCreated();

        $data = $res->json('data');
        $this->assertEquals($cat->id, $data['category_id']);
        $this->assertEquals($province->id, $data['province_id']);
        $this->assertEquals($district->id, $data['district_id']);
        $this->assertEquals($ward->id, $data['ward_id']);
        $this->assertEquals(3, $data['bedrooms']);
        $this->assertEquals(2, $data['bathrooms']);
        $this->assertEquals([$district->id, 999], $data['location_ids']);
        $this->assertStringContainsString('Quận Bình Thạnh', $data['area']);
        $this->assertStringContainsString('Phường 25', $data['area']);

        // Kiểm tra database
        $this->assertDatabaseHas('customer_demands', [
            'id' => $data['id'],
            'category_id' => $cat->id,
            'province_id' => $province->id,
            'district_id' => $district->id,
            'bedrooms' => 3,
            'bathrooms' => 2,
        ]);
    }

    /**
     * 3. Test tương thích dữ liệu cũ: các cột mới đều nullable
     */
    public function test_backward_compatibility_when_structured_fields_are_omitted(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);
        $type = PropertyType::firstOrCreate(['slug' => 'can-ho'], ['name' => 'Căn hộ', 'status' => 1]);

        $payloadLegacy = [
            'customer_id' => $customer->id,
            'property_type_id' => $type->id,
            'budget_min' => 1500000000,
            'budget_max' => 2500000000,
            'area' => 'Khu vực nội thành Hà Nội',
            'notes' => 'Tìm căn hộ 1 phòng ngủ',
            'status' => 'processing',
        ];

        $res = $this->postJson('/api/demands', $payloadLegacy);
        $res->assertCreated();

        $demand = CustomerDemand::find($res->json('data.id'));
        $this->assertNull($demand->category_id);
        $this->assertNull($demand->province_id);
        $this->assertNull($demand->district_id);
        $this->assertNull($demand->ward_id);
        $this->assertNull($demand->location_ids);
        $this->assertNull($demand->bedrooms);
        $this->assertNull($demand->bathrooms);
        $this->assertEquals('Khu vực nội thành Hà Nội', $demand->area);
    }

    /**
     * 4. Test API ghép tự động BĐS phù hợp với nhu cầu (GET /api/demands/{id}/matching-properties)
     */
    public function test_automatic_property_matching_filters_by_category_location_budget_and_bedrooms(): void
    {
        $this->actingAs($admin = $this->user());
        $customer = $this->customer($admin);

        $catApartment = Category::create(['name' => 'Căn hộ', 'slug' => 'can-ho', 'status' => 'active']);
        $catVilla = Category::create(['name' => 'Biệt thự', 'slug' => 'biet-thu', 'status' => 'active']);

        $province = Province::create(['name' => 'TP. Hồ Chí Minh']);
        $district1 = District::create(['province_id' => $province->id, 'name' => 'Quận 1']);
        $district7 = District::create(['province_id' => $province->id, 'name' => 'Quận 7']);

        // Nhu cầu của khách: Căn hộ, Quận 1, từ 2 phòng ngủ trở lên, ngân sách 2.5 tỷ - 4 tỷ VNĐ
        $demand = CustomerDemand::create([
            'customer_id' => $customer->id,
            'category_id' => $catApartment->id,
            'province_id' => $province->id,
            'district_id' => $district1->id,
            'bedrooms' => 2,
            'budget_min' => 2500000000,
            'budget_max' => 4000000000,
            'status' => 'processing',
        ]);

        // Property 1: Khớp hoàn toàn (Căn hộ, Quận 1, 2 phòng ngủ, giá 3.2 tỷ)
        $propMatch = Property::create([
            'title' => 'Căn hộ Quận 1 Đẹp Khớp Nhu Cầu',
            'category_id' => $catApartment->id,
            'province_id' => $province->id,
            'district_id' => $district1->id,
            'price_sale' => 3200000000,
            'bedrooms' => 2,
            'status' => 'available',
        ]);

        // Property 2: Khác category (Biệt thự, Quận 1, 3 phòng ngủ, giá 3.5 tỷ)
        $propWrongCat = Property::create([
            'title' => 'Biệt thự Quận 1 Giá Tốt',
            'category_id' => $catVilla->id,
            'province_id' => $province->id,
            'district_id' => $district1->id,
            'price_sale' => 3500000000,
            'bedrooms' => 3,
            'status' => 'available',
        ]);

        // Property 3: Khác quận (Căn hộ, Quận 7, 2 phòng ngủ, giá 3 tỷ)
        $propWrongLocation = Property::create([
            'title' => 'Căn hộ Quận 7 Giá Tốt',
            'category_id' => $catApartment->id,
            'province_id' => $province->id,
            'district_id' => $district7->id,
            'price_sale' => 3000000000,
            'bedrooms' => 2,
            'status' => 'available',
        ]);

        // Property 4: Vượt quá ngân sách (Căn hộ, Quận 1, 2 phòng ngủ, giá 7 tỷ)
        $propOverBudget = Property::create([
            'title' => 'Căn hộ Quận 1 Sang Trọng Giá Cao',
            'category_id' => $catApartment->id,
            'province_id' => $province->id,
            'district_id' => $district1->id,
            'price_sale' => 7000000000,
            'bedrooms' => 2,
            'status' => 'available',
        ]);

        $res = $this->getJson("/api/demands/{$demand->id}/matching-properties");
        $res->assertOk();

        $matchingData = $res->json('data');
        $this->assertCount(1, $matchingData, 'Chỉ có đúng 1 BĐS khớp với tất cả tiêu chí của nhu cầu');
        $this->assertEquals($propMatch->id, $matchingData[0]['id']);
    }

    /**
     * 5. Test API options trả về đầy đủ categories, provinces, districts, wards
     */
    public function test_options_api_returns_structured_location_and_category_references(): void
    {
        $this->actingAs($this->user());

        Category::create(['name' => 'Đất nền dự án', 'slug' => 'dat-nen', 'status' => 'active']);
        $p = Province::create(['name' => 'Hà Nội']);
        $d = District::create(['province_id' => $p->id, 'name' => 'Quận Cầu Giấy']);
        Ward::create(['district_id' => $d->id, 'name' => 'Phường Dịch Vọng']);

        $res = $this->getJson('/api/demands/options');
        $res->assertOk();

        $res->assertJsonStructure([
            'statuses',
            'property_types',
            'categories',
            'provinces',
            'districts',
            'wards',
        ]);

        $this->assertNotEmpty($res->json('categories'));
        $this->assertNotEmpty($res->json('provinces'));
        $this->assertNotEmpty($res->json('districts'));
        $this->assertNotEmpty($res->json('wards'));
    }
}
