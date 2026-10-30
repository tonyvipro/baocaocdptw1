<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'rent.view', 'description' => 'Xem danh sách và thống kê quản lý tiền thuê hàng tháng'],
            ['name' => 'payment.record', 'description' => 'Ghi nhận thanh toán thu tiền thuê nhà thủ công hoặc qua cổng'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['name' => $p['name']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $permIds = DB::table('permissions')->whereIn('name', array_column($permissions, 'name'))->pluck('id');

        // 1. Admin (role_id = 1)
        if (DB::table('roles')->where('id', 1)->exists()) {
            foreach ($permIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 1,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Môi giới (role_id = 2)
        if (DB::table('roles')->where('id', 2)->exists()) {
            foreach ($permIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 2,
                    'permission_id' => $pId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Nhân viên Staff (role_id = 4)
        if (DB::table('roles')->where('id', 4)->exists()) {
            foreach ($permIds as $pId) {
                DB::table('role_permissions')->updateOrInsert([
                    'role_id' => 4,
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
        $names = ['rent.view', 'payment.record'];
        $permIds = DB::table('permissions')->whereIn('name', $names)->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }
};
