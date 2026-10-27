<?php

namespace Database\Seeders;

use App\Models\Property;
use Illuminate\Database\Seeder;

/** Repair known demo records only; never overwrite a user's uploaded image. */
class RepairDemoPropertyImagesSeeder extends Seeder
{
    public const IMAGES = [
        'photo-1545324418-cc1a3fa10c00', 'photo-1522708323590-d24dbb6b0267',
        'photo-1502672260266-1c1ef2d93688', 'photo-1560448204-e02f11c3d0e2',
    ];

    public static function imageFor(string $code): string
    {
        return '/property-images/'.self::IMAGES[abs(crc32($code)) % count(self::IMAGES)].'.jpg';
    }

    public function run(): void
    {
        $codes = ['HT-Q7-R01', 'A101', 'LM81-402', 'VHCP-1205', 'MTD-A108', 'SRC-704',
            'MAP-1802', 'BTP-303', 'TSA-901', 'FEV-1508', 'GV-502', 'GWT-1102'];
        $count = 0;
        Property::whereIn('code', $codes)->each(function (Property $property) use (&$count) {
            if (!$property->image || str_contains($property->image, 'photo-1502005229762-ee1b2b8ab00f')) {
                $property->image = self::imageFor($property->code);
                $property->save();
                $count++;
            }
        });
        $this->command?->info("Đã bổ sung ảnh minh họa cho {$count} tin mẫu; giữ nguyên ảnh hợp lệ.");
    }
}
