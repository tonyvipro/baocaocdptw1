<?php

namespace Tests\Feature;

use App\Models\CustomerDemand;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\Role;
use App\Models\User;
use App\Support\PropertyPrice;
use Database\Seeders\CustomerDemandDemoSeeder;
use Database\Seeders\LowPricePropertyDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeders_create_requested_counts_and_preserve_edited_and_deleted_records_on_rerun(): void
    {
        Role::forceCreate(['id' => 1, 'name' => 'Admin']);
        User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'test-password', 'role_id' => 1]);
        PropertyType::create(['name' => 'Căn hộ', 'slug' => 'can-ho', 'status' => 1]);
        $seeders = [CustomerDemandDemoSeeder::class, LowPricePropertyDemoSeeder::class];
        $this->seed($seeders);
        $this->assertDatabaseCount('customer_demands', 10);
        $this->assertDatabaseCount('properties', 15);
        $this->assertEquals(1000, Property::min('price'));
        $this->assertEquals(5000, Property::max('price'));
        $this->assertEquals(15, Property::publiclyVisible()->count());
        $demand = CustomerDemand::first();
        $demand->update(['notes' => 'Ghi chú đã chỉnh sửa']);
        $deletedDemand = CustomerDemand::orderByDesc('id')->first();
        $deletedDemand->delete();
        $property = Property::first();
        $property->update(['title' => 'Tên đã sửa', 'price' => 4000]);
        $deletedProperty = Property::orderByDesc('id')->first();
        $deletedProperty->delete();

        $this->seed($seeders);
        $this->assertDatabaseCount('customer_demands', 10);
        $this->assertDatabaseCount('properties', 15);
        $this->assertSame('Ghi chú đã chỉnh sửa', $demand->fresh()->notes);
        $this->assertSame('Tên đã sửa', $property->fresh()->title);
        $this->assertSoftDeleted('customer_demands', ['id' => $deletedDemand->id]);
        $this->assertSoftDeleted('properties', ['id' => $deletedProperty->id]);
    }

    public function test_small_prices_are_not_rounded_to_zero_million(): void
    {
        $this->assertSame('1.000 đồng', PropertyPrice::format(1000));
        $this->assertSame('5.000 đồng/tháng', PropertyPrice::format(5000, true));
        $this->assertSame('12 triệu/tháng', PropertyPrice::format(12000000, true));
        $this->assertSame('2.5 tỷ', PropertyPrice::format(2500000000));
    }

    public function test_image_repair_only_fills_known_missing_or_broken_demo_photos(): void
    {
        $missing = Property::create(['code' => 'A101', 'title' => 'Demo', 'image' => null]);
        $uploaded = Property::create(['code' => 'LM81-402', 'title' => 'Uploaded', 'image' => '/uploads/real.jpg']);
        $unrelated = Property::create(['code' => 'CUSTOM-NEW', 'title' => 'Custom', 'image' => null]);
        $this->seed(\Database\Seeders\RepairDemoPropertyImagesSeeder::class);
        $image = $missing->fresh()->image;
        $this->assertStringStartsWith('/property-images/', $image);
        $this->assertFileExists(base_path('../frontend/public'.$image));
        $this->assertSame('/uploads/real.jpg', $uploaded->fresh()->image);
        $this->assertNull($unrelated->fresh()->image);
        $this->seed(\Database\Seeders\RepairDemoPropertyImagesSeeder::class);
        $this->assertSame($image, $missing->fresh()->image);
    }
}
