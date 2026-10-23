<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'invoice.view', 'description' => 'Xem danh sách và chi tiết hóa đơn tài chính'],
            ['name' => 'invoice.create', 'description' => 'Lập hóa đơn thanh toán mới'],
            ['name' => 'invoice.update', 'description' => 'Chỉnh sửa thông tin hóa đơn chưa thanh toán'],
            ['name' => 'invoice.cancel', 'description' => 'Hủy hóa đơn thanh toán (nhập lý do hủy)'],
            ['name' => 'invoice.send', 'description' => 'Gửi hóa đơn thanh toán qua email khách hàng'],
            ['name' => 'invoice.download', 'description' => 'Tải xuống hóa đơn thanh toán dưới dạng PDF'],
            ['name' => 'invoice.view_own', 'description' => 'Khách hàng xem hóa đơn thuộc hợp đồng của chính mình'],
            ['name' => 'invoice.download_own', 'description' => 'Khách hàng tải xuống PDF hóa đơn của chính mình'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['name' => $p['name']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 1. Admin (role_id = 1): Toàn quyền
        if (DB::table('roles')->where('id', 1)->exists()) {
            $adminPermIds = DB::table('permissions')->whereIn('name', array_column($permissions, 'name'))->pluck('id');
            foreach ($adminPermIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 1,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Môi giới BĐS (role_id = 2): view, create, update, cancel, send, download
        if (DB::table('roles')->where('id', 2)->exists()) {
            $brokerPermIds = DB::table('permissions')->whereIn('name', [
                'invoice.view',
                'invoice.create',
                'invoice.update',
                'invoice.cancel',
                'invoice.send',
                'invoice.download',
            ])->pluck('id');

            foreach ($brokerPermIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 2,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Nhân viên Staff (role_id = 4): view, create, update, cancel, send, download
        if (DB::table('roles')->where('id', 4)->exists()) {
            $staffPermIds = DB::table('permissions')->whereIn('name', [
                'invoice.view',
                'invoice.create',
                'invoice.update',
                'invoice.cancel',
                'invoice.send',
                'invoice.download',
            ])->pluck('id');

            foreach ($staffPermIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 4,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 4. Khách hàng Customer (role_id = 5): view_own, download_own
        if (DB::table('roles')->where('id', 5)->exists()) {
            $customerPermIds = DB::table('permissions')->whereIn('name', [
                'invoice.view_own',
                'invoice.download_own',
            ])->pluck('id');

            foreach ($customerPermIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 5,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $names = [
            'invoice.view',
            'invoice.create',
            'invoice.update',
            'invoice.cancel',
            'invoice.send',
            'invoice.download',
            'invoice.view_own',
            'invoice.download_own',
        ];

        $permIds = DB::table('permissions')->whereIn('name', $names)->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }
};
