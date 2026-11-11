<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Property;
use App\Models\Role as RoleModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryPropertyRelationTest extends TestCase
{
    use RefreshDatabase;

    private function seedRole(Role $role): void
    {
        if (!RoleModel::find($role->value)) {
            RoleModel::forceCreate([
                'id' => $role->value,
                'name' => $role->databaseName(),
                'description' => $role->description(),
            ]);
        }
    }

    private function createAdmin(): User
    {
        $this->seedRole(Role::Admin);
        return User::create([
            'name' => 'Admin User',
            'email' => 'admin_cat_test@example.com',
            'password' => bcrypt('password123'),
            'role_id' => Role::Admin->value,
            'is_active' => true,
        ]);
    }

    private function createProperty(array $attributes = []): Property
    {
        return Property::create(array_merge([
            'title' => 'Căn hộ kiểm thử',
            'type' => 'Căn hộ chung cư',
            'purpose' => 'sale',
            'price' => 2500000000,
            'area' => 75.5,
            'status' => 1,
            'address' => '123 Đường Test, Quận 1',
            'city' => 'TP. Hồ Chí Minh',
            'district' => 'Quận 1',
        ], $attributes));
    }

    public function test_property_creation_and_update_with_valid_category_id(): void
    {
        $admin = $this->createAdmin();
        $category = Category::create([
            'name' => 'Căn hộ chung cư cao cấp',
            'slug' => 'can-ho-chung-cu-cao-cap',
            'status' => 'active',
            'display_order' => 1,
        ]);

        $res = $this->actingAs($admin, 'sanctum')->postJson('/api/properties', [
            'title' => 'Căn hộ Landmark 81 cực đẹp',
            'category_id' => $category->id,
            'type' => 'Căn hộ chung cư cao cấp',
            'purpose' => 'sale',
            'price' => 5000000000,
            'area' => 88.5,
            'address' => '720A Điện Biên Phủ, Bình Thạnh',
            'city' => 'TP. Hồ Chí Minh',
            'district' => 'Bình Thạnh',
            'bedrooms' => 2,
            'bathrooms' => 2,
            'status' => 1,
        ]);

        $res->assertStatus(201);
        $propertyId = $res->json('data.id');

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'category_id' => $category->id,
        ]);

        $property = Property::find($propertyId);
        $this->assertNotNull($property->category);
        $this->assertEquals($category->id, $property->category->id);
        $this->assertEquals('Căn hộ chung cư cao cấp', $property->category->name);
    }

    public function test_category_index_and_show_return_accurate_properties_count(): void
    {
        $admin = $this->createAdmin();
        $catA = Category::create(['name' => 'Biệt thự sân vườn', 'slug' => 'biet-thu-san-vuon', 'status' => 'active']);
        $catB = Category::create(['name' => 'Nhà phố thương mại', 'slug' => 'nha-pho-thuong-mai', 'status' => 'active']);

        // Gán 2 BĐS vào Cat A, 1 BĐS vào Cat B
        $this->createProperty(['category_id' => $catA->id, 'title' => 'Biệt thự A1']);
        $this->createProperty(['category_id' => $catA->id, 'title' => 'Biệt thự A2']);
        $this->createProperty(['category_id' => $catB->id, 'title' => 'Nhà phố B1']);

        // API GET /api/categories
        $resIndex = $this->actingAs($admin, 'sanctum')->getJson('/api/categories?search=Biệt thự sân vườn');
        $resIndex->assertStatus(200);
        $items = $resIndex->json('data');
        $this->assertNotEmpty($items);
        $this->assertEquals(2, $items[0]['properties_count']);

        // API GET /api/categories/{id}
        $resShow = $this->actingAs($admin, 'sanctum')->getJson("/api/categories/{$catA->id}");
        $resShow->assertStatus(200);
        $this->assertEquals(2, $resShow->json('data.properties_count'));

        $resShowB = $this->actingAs($admin, 'sanctum')->getJson("/api/categories/{$catB->id}");
        $resShowB->assertStatus(200);
        $this->assertEquals(1, $resShowB->json('data.properties_count'));
    }

    public function test_category_deletion_blocked_with_422_when_it_has_properties(): void
    {
        $admin = $this->createAdmin();
        $category = Category::create(['name' => 'Đất nền ven đô', 'slug' => 'dat-nen-ven-do', 'status' => 'active']);
        $this->createProperty(['category_id' => $category->id, 'title' => 'Lô đất A']);

        $res = $this->actingAs($admin, 'sanctum')->deleteJson("/api/categories/{$category->id}", [
            'version' => $category->version ?? 1,
        ]);

        $res->assertStatus(422);
        $res->assertJson([
            'status' => 'error',
            'error_code' => 'CATEGORY_HAS_PROPERTIES',
            'properties_count' => 1,
        ]);

        // Danh mục không bị xóa
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'deleted_at' => null,
        ]);
    }

    public function test_category_deletion_with_reassign_moves_properties_and_deletes_category(): void
    {
        $admin = $this->createAdmin();
        $sourceCat = Category::create(['name' => 'Phòng trọ cao cấp', 'slug' => 'phong-tro-cao-cap', 'status' => 'active']);
        $targetCat = Category::create(['name' => 'Căn hộ mini dịch vụ', 'slug' => 'can-ho-mini-dich-vu', 'status' => 'active']);

        $p1 = $this->createProperty(['category_id' => $sourceCat->id, 'title' => 'Phòng 101']);
        $p2 = $this->createProperty(['category_id' => $sourceCat->id, 'title' => 'Phòng 102']);

        $res = $this->actingAs($admin, 'sanctum')->deleteJson("/api/categories/{$sourceCat->id}", [
            'version' => $sourceCat->version ?? 1,
            'reassign_to_category_id' => $targetCat->id,
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'status' => 'success',
            'reassigned_count' => 2,
        ]);

        // Kiểm tra toàn bộ BĐS đã chuyển sang danh mục mới
        $this->assertEquals($targetCat->id, $p1->fresh()->category_id);
        $this->assertEquals($targetCat->id, $p2->fresh()->category_id);

        // Danh mục cũ đã bị soft delete
        $this->assertSoftDeleted('categories', ['id' => $sourceCat->id]);
    }

    public function test_category_deletion_succeeds_when_no_properties(): void
    {
        $admin = $this->createAdmin();
        $emptyCat = Category::create(['name' => 'Danh mục trống', 'slug' => 'danh-muc-trong', 'status' => 'active']);

        $res = $this->actingAs($admin, 'sanctum')->deleteJson("/api/categories/{$emptyCat->id}", [
            'version' => $emptyCat->version ?? 1,
        ]);

        $res->assertStatus(200);
        $res->assertJson(['status' => 'success']);
        $this->assertSoftDeleted('categories', ['id' => $emptyCat->id]);
    }

    public function test_category_options_endpoint_returns_active_categories_with_properties_count(): void
    {
        $cat = Category::create(['name' => 'Văn phòng Coworking', 'slug' => 'van-phong-coworking', 'status' => 'active', 'display_order' => 1]);
        $this->createProperty(['category_id' => $cat->id, 'title' => 'Chỗ ngồi làm việc']);

        $res = $this->getJson('/api/categories/options');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'status',
            'data' => [
                '*' => ['id', 'name', 'slug', 'status']
            ]
        ]);
    }
}

