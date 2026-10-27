<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Database\Seeder;

class LowPricePropertyDemoSeeder extends Seeder
{
    public function run(): void
    {
        $types = PropertyType::where('status', 1)->orderBy('id')->get();
        if ($types->isEmpty()) throw new \RuntimeException('Cần ít nhất một loại BĐS đang hoạt động trước khi seed BĐS.');
        $owner = User::where('is_active', true)->whereIn('role_id', [1, 2])->orderBy('role_id')->first();
        $photos = ['photo-1545324418-cc1a3fa10c00', 'photo-1600585154340-be6161a56a0c', 'photo-1522708323590-d24dbb6b0267'];
        for ($i = 1; $i <= 15; $i++) {
            $code = 'DEMO-GIA-'.str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $price = 1000 + (($i - 1) % 5) * 1000;
            $type = $types[($i - 1) % $types->count()];
            Property::withTrashed()->firstOrCreate(['code' => $code], [
                'title' => 'BĐS mẫu '.str_pad((string) $i, 2, '0', STR_PAD_LEFT).' — '.$type->name,
                'description' => 'Dữ liệu mẫu phục vụ kiểm thử giao diện và bộ lọc. Giá thử nghiệm 1.000–5.000 VNĐ, không phải tin giao dịch thực tế.',
                'price' => $price, 'price_sale' => $price, 'price_sale_text' => number_format($price, 0, ',', '.').' đồng',
                'purpose' => 'sale', 'status' => 1, 'property_type_id' => $type->id, 'type' => $type->name,
                'area' => 45 + $i * 5, 'bedrooms' => 1 + ($i % 3), 'bathrooms' => 1 + ($i % 2),
                'project' => 'Dự án mẫu kiểm thử', 'address' => ($i * 10).' Đường Mẫu, Thủ Đức, TP. Hồ Chí Minh',
                'street' => ($i * 10).' Đường Mẫu', 'district' => 'Thủ Đức', 'city' => 'TP. Hồ Chí Minh',
                'lat' => 10.82 + $i / 10000, 'lng' => 106.73 + $i / 10000,
                'image' => '/property-images/'.$photos[($i - 1) % count($photos)].'.jpg',
                'user_id' => $owner?->id, 'expire_date' => now()->addYear(),
            ]);
        }
    }
}
