<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with 33 tables structure.
     */
    public function run(): void
    {
        // 1. Roles (Spec 4.2.1.2)
        $roles = [
            ['id' => 1, 'name' => 'Admin', 'description' => 'Quản trị viên toàn quyền hệ thống'],
            ['id' => 2, 'name' => 'BĐS', 'description' => 'Môi giới BĐS - Quyền đăng và quản lý tin'],
            ['id' => 3, 'name' => 'Owner', 'description' => 'Chủ sở hữu - Quyền sở hữu và xem báo cáo'],
            ['id' => 4, 'name' => 'Staff', 'description' => 'Nhân viên - Quyền quản lý hệ thống hạn chế'],
            ['id' => 5, 'name' => 'Customer', 'description' => 'Khách hàng - Xem, tìm kiếm, lưu tin, đặt lịch hẹn'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['id' => $role['id']], array_merge($role, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 2. Permissions & Role Permissions (Spec 4.2.1.24 & 4.2.1.25)
        $permissions = [
            ['id' => 1, 'name' => 'view_dashboard', 'description' => 'Xem bảng điều khiển'],
            ['id' => 2, 'name' => 'manage_properties', 'description' => 'Quản lý tin đăng bất động sản'],
            ['id' => 3, 'name' => 'approve_properties', 'description' => 'Kiểm duyệt tin đăng BĐS'],
            ['id' => 4, 'name' => 'manage_appointments', 'description' => 'Quản lý lịch hẹn xem nhà'],
            ['id' => 5, 'name' => 'manage_contracts', 'description' => 'Quản lý hợp đồng & pháp lý'],
            ['id' => 6, 'name' => 'manage_finance', 'description' => 'Quản lý hóa đơn & thanh toán'],
            ['id' => 7, 'name' => 'manage_users', 'description' => 'Quản lý tài khoản & phân quyền'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['id' => $p['id']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Gán permissions cho Admin & BĐS
        $rolePermissions = [
            ['role_id' => 1, 'permission_id' => 1],
            ['role_id' => 1, 'permission_id' => 2],
            ['role_id' => 1, 'permission_id' => 3],
            ['role_id' => 1, 'permission_id' => 4],
            ['role_id' => 1, 'permission_id' => 5],
            ['role_id' => 1, 'permission_id' => 6],
            ['role_id' => 1, 'permission_id' => 7],
            ['role_id' => 2, 'permission_id' => 1],
            ['role_id' => 2, 'permission_id' => 2],
            ['role_id' => 2, 'permission_id' => 4],
            ['role_id' => 2, 'permission_id' => 5],
        ];

        foreach ($rolePermissions as $rp) {
            DB::table('role_permissions')->updateOrInsert($rp, [
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Địa giới hành chính: Provinces, Districts, Wards (Spec 4.2.1.14, 15, 16)
        $provinces = [
            ['id' => 1, 'name' => 'TP. Hồ Chí Minh'],
            ['id' => 2, 'name' => 'TP. Hà Nội'],
            ['id' => 3, 'name' => 'TP. Đà Nẵng'],
            ['id' => 4, 'name' => 'Bình Dương'],
        ];
        foreach ($provinces as $prov) {
            DB::table('provinces')->updateOrInsert(['id' => $prov['id']], array_merge($prov, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $districts = [
            ['id' => 1, 'province_id' => 1, 'name' => 'Quận 1'],
            ['id' => 2, 'province_id' => 1, 'name' => 'Quận Bình Thạnh'],
            ['id' => 3, 'province_id' => 1, 'name' => 'TP. Thủ Đức'],
            ['id' => 4, 'province_id' => 1, 'name' => 'Quận 7'],
            ['id' => 5, 'province_id' => 2, 'name' => 'Quận Nam Từ Liêm'],
            ['id' => 6, 'province_id' => 2, 'name' => 'Quận Cầu Giấy'],
        ];
        foreach ($districts as $dist) {
            DB::table('districts')->updateOrInsert(['id' => $dist['id']], array_merge($dist, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $wards = [
            ['id' => 1, 'district_id' => 1, 'name' => 'Phường Bến Nghé'],
            ['id' => 2, 'district_id' => 1, 'name' => 'Phường Đa Kao'],
            ['id' => 3, 'district_id' => 2, 'name' => 'Phường 22'],
            ['id' => 4, 'district_id' => 3, 'name' => 'Phường Long Thạnh Mỹ'],
            ['id' => 5, 'district_id' => 4, 'name' => 'Phường Tân Phong'],
        ];
        foreach ($wards as $ward) {
            DB::table('wards')->updateOrInsert(['id' => $ward['id']], array_merge($ward, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 4. Property Types (Spec 4.2.1.4)
        $propertyTypes = [
            ['id' => 1, 'name' => 'Căn hộ cao cấp', 'slug' => 'can-ho-cao-cap'],
            ['id' => 2, 'name' => 'Nhà phố liền kề', 'slug' => 'nha-pho-lien-ke'],
            ['id' => 3, 'name' => 'Biệt thự đơn lập', 'slug' => 'biet-thu-don-lap'],
            ['id' => 4, 'name' => 'Shophouse thương mại', 'slug' => 'shophouse-thuong-mai'],
            ['id' => 5, 'name' => 'Đất nền dự án', 'slug' => 'dat-nen-du-an'],
            ['id' => 6, 'name' => 'Penthouse Sky Villa', 'slug' => 'penthouse-sky-villa'],
        ];
        foreach ($propertyTypes as $pt) {
            DB::table('property_types')->updateOrInsert(['id' => $pt['id']], array_merge($pt, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 5. Users mẫu (Spec 4.2.1.1)
        $users = [
            [
                'id' => 1,
                'name' => 'Nguyễn Quản Trị (Admin)',
                'email' => 'admin@3tvland.vn',
                'password' => Hash::make('Admin@123456'),
                'phone' => '0901234567',
                'role_id' => 1,
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'dark_mode' => 0,
            ],
            [
                'id' => 2,
                'name' => 'Nguyễn Đặng Trường Giang',
                'email' => 'giang.nguyen@3tvland.vn',
                'password' => Hash::make('Password@123'),
                'phone' => '0912345678',
                'role_id' => 2,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'dark_mode' => 0,
            ],
            [
                'id' => 3,
                'name' => 'Phạm Lê Hoàng Hào',
                'email' => 'hao.pham@3tvland.vn',
                'password' => Hash::make('Password@123'),
                'phone' => '0923456789',
                'role_id' => 2,
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'dark_mode' => 0,
            ],
            [
                'id' => 4,
                'name' => 'Phạm Đoàn Tony Quyền',
                'email' => 'tony.pham@3tvland.vn',
                'password' => Hash::make('Password@123'),
                'phone' => '0934567890',
                'role_id' => 2,
                'avatar' => 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'dark_mode' => 0,
            ],
            [
                'id' => 5,
                'name' => 'Nguyễn Văn Khách Hàng',
                'email' => 'khachhang@gmail.com',
                'password' => Hash::make('Khach@123456'),
                'phone' => '0987654321',
                'role_id' => 5,
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'dark_mode' => 0,
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(['id' => $user['id']], array_merge($user, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 6. Service Packages (Spec 4.2.1.21)
        $packages = [
            ['id' => 1, 'name' => 'Gói Cơ Bản (Standard)', 'price' => 299000, 'duration_days' => 30, 'post_limit' => 5],
            ['id' => 2, 'name' => 'Gói Chuyên Nghiệp (VIP)', 'price' => 799000, 'duration_days' => 30, 'post_limit' => 20],
            ['id' => 3, 'name' => 'Gói Doanh Nghiệp (Enterprise)', 'price' => 1999000, 'duration_days' => 60, 'post_limit' => 100],
        ];
        foreach ($packages as $pkg) {
            DB::table('service_packages')->updateOrInsert(['id' => $pkg['id']], array_merge($pkg, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 7. Seed Properties (Spec 4.2.1.5)
        $this->call([
            PropertySeeder::class,
            AppointmentSeeder::class,
        ]);
    }
}
