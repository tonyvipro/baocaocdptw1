<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = \App\Models\User::where('role_id', 5)->pluck('id')->toArray();
        $brokers = \App\Models\User::where('role_id', 2)->pluck('id')->toArray();
        $properties = \App\Models\Property::pluck('id')->toArray();

        // Fallback IDs if database is empty
        if (empty($customers)) $customers = [1];
        if (empty($brokers)) $brokers = [1];
        if (empty($properties)) $properties = [1];

        $notes = [
            'Khách hàng muốn xem thực tế nội thất căn hộ.',
            'Cần check lại giấy tờ pháp lý sổ hồng.',
            'Hẹn xem nhà vào buổi tối sau giờ hành chính.',
            'Khách VIP, cần chuẩn bị kỹ hợp đồng.',
            'Khách muốn thương lượng lại giá thuê.',
        ];

        for ($i = 0; $i < 10; $i++) {
            \App\Models\Appointment::create([
                'customer_id' => $customers[array_rand($customers)],
                'broker_id' => $brokers[array_rand($brokers)],
                'property_id' => $properties[array_rand($properties)],
                'appointment_time' => now()->addDays(rand(-5, 15))->addHours(rand(8, 18)),
                'status' => rand(0, 3), // 0: Chờ xác nhận, 1: Đã xác nhận, 2: Đã hoàn thành, 3: Đã hủy
                'note' => $notes[array_rand($notes)],
            ]);
        }
    }
}
