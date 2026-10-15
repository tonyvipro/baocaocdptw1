<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Broker;
use App\Models\BrokerAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BrokerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Danh sách môi giới mẫu (Chuẩn Hình 29)
        $brokersData = [
            [
                'code' => 'MG-001',
                'name' => 'Nguyễn Đặng Trường Giang',
                'phone' => '0901234567',
                'email' => 'giang.nguyen@3tvland.vn',
                'level' => 'Trưởng nhóm',
                'deals_count' => 24,
                'total_commission' => 185000000,
                'status' => 'active',
                'notes' => 'Chuyên căn hộ cao cấp khu vực Bình Thạnh và Quận 2.',
            ],
            [
                'code' => 'MG-002',
                'name' => 'Phạm Lê Hoàng Hảo',
                'phone' => '0902345678',
                'email' => 'hao.pham@3tvland.vn',
                'level' => 'Chuyên viên',
                'deals_count' => 18,
                'total_commission' => 120000000,
                'status' => 'active',
                'notes' => 'Thế mạnh khu vực Thảo Điền và TP. Thủ Đức.',
            ],
            [
                'code' => 'MG-003',
                'name' => 'Phạm Đoàn Tony Quyền',
                'phone' => '0903456789',
                'email' => 'tony.pham@3tvland.vn',
                'level' => 'Giám đốc kinh doanh',
                'deals_count' => 35,
                'total_commission' => 320000000,
                'status' => 'active',
                'notes' => 'Quản lý dự án biệt thự, nhà phố trung tâm Quận 1 và Quận 3.',
            ],
            [
                'code' => 'MG-004',
                'name' => 'Trần Văn Nam',
                'phone' => '0904567890',
                'email' => 'nam.tran@3tvland.vn',
                'level' => 'Chuyên viên',
                'deals_count' => 12,
                'total_commission' => 75000000,
                'status' => 'active',
                'notes' => 'Chuyên shophouse và mặt bằng thương mại Gò Vấp, Phú Nhuận.',
            ],
            [
                'code' => 'MG-005',
                'name' => 'Lê Thị Mai',
                'phone' => '0905678901',
                'email' => 'mai.le@3tvland.vn',
                'level' => 'Tập sự',
                'deals_count' => 4,
                'total_commission' => 22000000,
                'status' => 'busy',
                'notes' => 'Đang phụ trách dẫn khách dự án The Sun Avenue.',
            ],
            [
                'code' => 'MG-006',
                'name' => 'Hoàng Minh Trí',
                'phone' => '0906789012',
                'email' => 'tri.hoang@3tvland.vn',
                'level' => 'Chuyên viên',
                'deals_count' => 15,
                'total_commission' => 95000000,
                'status' => 'active',
                'notes' => 'Chuyên phân khúc đất nền và dự án vùng ven.',
            ],
            [
                'code' => 'MG-007',
                'name' => 'Đỗ Quỳnh Như',
                'phone' => '0907890123',
                'email' => 'nhu.do@3tvland.vn',
                'level' => 'Trưởng nhóm',
                'deals_count' => 20,
                'total_commission' => 150000000,
                'status' => 'inactive',
                'notes' => 'Tạm nghỉ phép cá nhân.',
            ],
            [
                'code' => 'MG-008',
                'name' => 'Vũ Anh Khoa',
                'phone' => '0908901234',
                'email' => 'khoa.vu@3tvland.vn',
                'level' => 'Tập sự',
                'deals_count' => 2,
                'total_commission' => 10000000,
                'status' => 'active',
                'notes' => 'Tập sự bán hàng phân khúc chung cư tầm trung.',
            ],
        ];

        $createdBrokers = [];
        foreach ($brokersData as $b) {
            $user = User::where('email', $b['email'])->first();
            $createdBrokers[] = Broker::updateOrInsert(
                ['code' => $b['code']],
                array_merge($b, [
                    'user_id' => $user?->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $allBrokers = Broker::all();
        if ($allBrokers->count() > 0) {
            $mg1 = $allBrokers->where('code', 'MG-001')->first() ?? $allBrokers->first();
            $mg2 = $allBrokers->where('code', 'MG-002')->first() ?? $allBrokers->first();
            $mg3 = $allBrokers->where('code', 'MG-003')->first() ?? $allBrokers->first();
            $mg4 = $allBrokers->where('code', 'MG-004')->first() ?? $allBrokers->first();
            $mg6 = $allBrokers->where('code', 'MG-006')->first() ?? $allBrokers->first();

            // Danh sách phân công mẫu (Chuẩn Hình 30)
            $assignmentsData = [
                [
                    'request_code' => 'YC-2026-001',
                    'customer_name' => 'Nguyễn Thu Thảo',
                    'customer_phone' => '0912345678',
                    'customer_email' => 'thuthao.ng@gmail.com',
                    'property_location' => 'Vinhomes Central Park, Bình Thạnh, TP.HCM',
                    'broker_id' => $mg1->id,
                    'assigned_date' => '2026-10-10',
                    'status' => 'processing',
                    'notes' => 'Khách cần xem căn hộ 2PN Landmark 81 cuối tuần.',
                ],
                [
                    'request_code' => 'YC-2026-002',
                    'customer_name' => 'Trần Văn Bình',
                    'customer_phone' => '0923456789',
                    'customer_email' => 'binhtran.bds@gmail.com',
                    'property_location' => 'Masteri Thảo Điền, TP. Thủ Đức, TP.HCM',
                    'broker_id' => $mg2->id,
                    'assigned_date' => '2026-10-11',
                    'status' => 'completed',
                    'notes' => 'Đã ký hợp đồng đặt cọc thành công ngày 14/10.',
                ],
                [
                    'request_code' => 'YC-2026-003',
                    'customer_name' => 'Lê Hoàng Yến',
                    'customer_phone' => '0934567890',
                    'customer_email' => 'yenhoang.le@gmail.com',
                    'property_location' => 'The Sun Avenue, Quận 2, TP.HCM',
                    'broker_id' => $mg3->id,
                    'assigned_date' => '2026-10-12',
                    'status' => 'pending',
                    'notes' => 'Khách tìm căn officetel để mở văn phòng thiết kế.',
                ],
                [
                    'request_code' => 'YC-2026-004',
                    'customer_name' => 'Đặng Quốc Hưng',
                    'customer_phone' => '0945678901',
                    'customer_email' => 'hung.dang@gmail.com',
                    'property_location' => 'Khu đô thị Sala, Quận 2, TP.HCM',
                    'broker_id' => $mg1->id,
                    'assigned_date' => '2026-10-13',
                    'status' => 'processing',
                    'notes' => 'Khách VIP tìm biệt thự Saroma khu Sala.',
                ],
                [
                    'request_code' => 'YC-2026-005',
                    'customer_name' => 'Vũ Bích Ngọc',
                    'customer_phone' => '0956789012',
                    'customer_email' => 'ngocvu@gmail.com',
                    'property_location' => 'Đất nền dự án Long Thành, Đồng Nai',
                    'broker_id' => $mg6->id,
                    'assigned_date' => '2026-10-14',
                    'status' => 'cancelled',
                    'notes' => 'Khách dời kế hoạch đầu tư sang quý 1 năm sau.',
                ],
                [
                    'request_code' => 'YC-2026-006',
                    'customer_name' => 'Ngô Hải Đăng',
                    'customer_phone' => '0967890123',
                    'customer_email' => 'haidang.ngo@gmail.com',
                    'property_location' => 'Nhà phố Cityland Park Hills, Gò Vấp, TP.HCM',
                    'broker_id' => $mg4->id,
                    'assigned_date' => '2026-10-15',
                    'status' => 'pending',
                    'notes' => 'Khách cần xem nhà vào 9h sáng thứ Bảy tuần này.',
                ],
            ];

            foreach ($assignmentsData as $a) {
                BrokerAssignment::updateOrInsert(
                    ['request_code' => $a['request_code']],
                    array_merge($a, [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );
            }
        }
    }
}
