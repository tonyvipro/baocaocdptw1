<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerDemandDemoSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::where('is_active', true)->whereIn('role_id', [1, 2])->orderBy('role_id')->first();
        $types = PropertyType::where('status', 1)->orderBy('id')->get();
        if ($types->isEmpty()) throw new \RuntimeException('Cần ít nhất một loại BĐS đang hoạt động trước khi seed nhu cầu.');
        $customers = Customer::orderBy('id')->take(10)->get();
        $areas = ['Thủ Đức, TP.HCM', 'Quận 7, TP.HCM', 'Bình Thạnh, TP.HCM', 'Quận 1, TP.HCM', 'Bình Chánh, TP.HCM',
            'Dĩ An, Bình Dương', 'Hải Châu, Đà Nẵng', 'Nam Từ Liêm, Hà Nội', 'Cầu Giấy, Hà Nội', 'Biên Hòa, Đồng Nai'];
        $statuses = array_keys(CustomerDemand::STATUSES);
        for ($i = 0; $i < 10; $i++) {
            $marker = '[DEMO-NHU-CAU-'.str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT).']';
            if (CustomerDemand::withTrashed()->where('seed_key', 'demo-demand:'.($i + 1))->exists()) continue;
            $customer = $customers[$i] ?? Customer::withTrashed()->firstOrCreate(
                ['email' => 'demand-demo-'.($i + 1).'@example.com'],
                ['name' => 'Khách hàng nhu cầu mẫu '.($i + 1), 'source' => 'Dữ liệu mẫu', 'assigned_to' => $manager?->id, 'created_by' => $manager?->id]
            );
            if ($customer->trashed()) continue;
            $demand = new CustomerDemand;
            $demand->forceFill([
                'seed_key' => 'demo-demand:'.($i + 1),
                'customer_id' => $customer->id, 'property_type_id' => $types[$i % $types->count()]->id,
                'budget_min' => 1000000000 + $i * 250000000, 'budget_max' => 2000000000 + $i * 350000000,
                'area' => $areas[$i], 'status' => $statuses[$i % count($statuses)],
                'notes' => $marker.' Nhu cầu mẫu để kiểm tra tìm kiếm, bộ lọc và quy trình tư vấn.', 'created_by' => $manager?->id,
            ])->save();
        }
    }
}
