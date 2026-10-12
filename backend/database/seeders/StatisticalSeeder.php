<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Property;
use App\Models\User;

class StatisticalSeeder extends Seeder
{
    public function run(): void
    {
        $propertyId = DB::table('properties')->first()->id ?? 1;
        $customerId = DB::table('users')->where('role_id', 5)->first()->id ?? 5;

        // Clear old data
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        DB::table('contracts')->truncate();
        DB::table('invoices')->truncate();
        DB::table('maintenance_requests')->truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // 1. Tạo Hợp đồng (Contracts)
        for ($i = 1; $i <= 15; $i++) {
            DB::table('contracts')->insert([
                'property_id' => $propertyId,
                'customer_id' => $customerId,
                'contract_code' => 'HD-2023-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'contract_name' => 'Hợp đồng thuê BĐS số ' . $i,
                'start_date' => now()->subDays(rand(1, 30)),
                'end_date' => now()->addDays(rand(10, 60)), // Sắp hết hạn
                'rental_price' => rand(10, 30) * 1000000, // 10tr - 30tr
                'status' => 1, // 1 = Đang hiệu lực
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }

        // 2. Tạo Hóa đơn (Invoices) để có Doanh thu
        for ($i = 1; $i <= 20; $i++) {
            DB::table('invoices')->insert([
                'contract_id' => rand(1, 15),
                'title' => 'Hóa đơn tiền thuê tháng ' . rand(1,12),
                'type' => 'RENT',
                'amount' => rand(15, 30) * 1000000,
                'status' => 1, // 1 = Đã thanh toán
                'due_date' => now()->addDays(rand(1, 10)),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }

        // 3. Tạo Yêu cầu bảo trì (Maintenance Requests)
        for ($i = 1; $i <= 8; $i++) {
            DB::table('maintenance_requests')->insert([
                'property_id' => $propertyId,
                'user_id' => $customerId,
                'title' => 'Bảo trì hệ thống ' . $i,
                'description' => 'Chi tiết bảo trì ' . $i,
                'status' => $i <= 3 ? 'IN_PROGRESS' : 'COMPLETED',
                'priority' => 'MEDIUM',
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }
    }
}
