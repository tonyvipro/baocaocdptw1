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
            $data = json_decode(File::get($jsonPath), true);
            
            foreach ($data as $item) {
                Property::updateOrCreate(
                    ['code' => $item['code']],
                    [
                        'title' => $item['title'],
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
                        'area' => $item['area'],
                        'bedrooms' => $item['bedrooms'],
                        'bathrooms' => $item['bathrooms'],
                        'street' => $item['street'],
                        'district' => $item['district'],
                        'city' => $item['city'],
                        'lat' => $item['lat'],
                        'lng' => $item['lng'],
                        'image' => $item['image'],
                        'badge' => $item['badge'] ?? null,
                        'badge_class' => $item['badge_class'] ?? null,
                        'owner_name' => $item['owner_name'] ?? null,
                        'owner_phone' => $item['owner_phone'] ?? null,
                        'status' => 'available',
                    ]
                );
            }
        }
    }
}
