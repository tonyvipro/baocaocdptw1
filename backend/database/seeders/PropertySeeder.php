<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use Illuminate\Support\Facades\File;

class PropertySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/all_properties.json');
        if (!File::exists($jsonPath)) {
            $jsonPath = database_path('data/vinhomes_properties.json');
        }
        
        if (File::exists($jsonPath)) {
            $data = json_decode(File::get($jsonPath), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($data) || !array_is_list($data)) throw new \RuntimeException('File bất động sản phải là danh sách JSON.');
            $codes = array_column($data, 'code');
            if (count($codes) !== count($data) || count(array_unique($codes)) !== count($codes)) throw new \RuntimeException('Mã bất động sản thiếu hoặc bị trùng trong file.');
            
            foreach ($data as $item) {
                $address = trim(($item['street'] ?? '') . ', ' . ($item['district'] ?? '') . ', ' . ($item['city'] ?? ''));
                $price = ($item['purpose'] ?? 'sale') === 'rent' ? ($item['price_rent'] ?? 0) : ($item['price_sale'] ?? 0);

                // Import missing records only; database edits and deletions win.
                Property::withTrashed()->firstOrCreate(
                    ['code' => $item['code']],
                    [
                        'title' => $item['title'],
                        'description' => $item['description'] ?? ($item['title'] . ' - Bất động sản cao cấp, vị trí đắc địa, pháp lý minh bạch.'),
                        'price' => $price,
                        'address' => $address ?: 'TP. Hồ Chí Minh',
                        'developer' => $item['developer'] ?? 'Vinhomes',
                        'project' => $item['project'],
                        'purpose' => $item['purpose'],
                        'type' => $item['type'],
                        'price_sale' => $item['price_sale'] ?? null,
                        'price_sale_text' => $item['price_sale_text'] ?? null,
                        'price_rent' => $item['price_rent'] ?? null,
                        'price_rent_text' => $item['price_rent_text'] ?? null,
                        'deposit' => $item['deposit'] ?? null,
                        'deposit_text' => $item['deposit_text'] ?? null,
                        'unit_price' => $item['unit_price'] ?? null,
                        'legal' => $item['legal'] ?? null,
                        'rent_period_min' => $item['rent_period_min'] ?? null,
                        'furniture' => $item['furniture'] ?? null,
                        'management_fee' => $item['management_fee'] ?? null,
                        'available_date' => $item['available_date'] ?? null,
                        'area' => $item['area'] ?? 0,
                        'bedrooms' => $item['bedrooms'] ?? 0,
                        'bathrooms' => $item['bathrooms'] ?? 0,
                        'street' => $item['street'] ?? null,
                        'district' => $item['district'] ?? null,
                        'city' => $item['city'] ?? 'TP. Hồ Chí Minh',
                        'lat' => $item['lat'] ?? null,
                        'lng' => $item['lng'] ?? null,
                        'image' => $item['image'] ?? null,
                        'badge' => $item['badge'] ?? null,
                        'badge_class' => $item['badge_class'] ?? null,
                        'owner_name' => $item['owner_name'] ?? null,
                        'owner_phone' => $item['owner_phone'] ?? null,
                        'status' => 1,
                    ]
                );
            }
        }
    }
}
