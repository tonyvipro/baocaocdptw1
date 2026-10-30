<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'payment.view', 'description' => 'Xem danh sách công nợ và lịch sử thanh toán'],
            ['name' => 'payment.qr', 'description' => 'Tạo mã thanh toán QR cổng điện tử'],
            ['name' => 'payment.cancel', 'description' => 'Hủy giao dịch thanh toán đang chờ xử lý'],
            ['name' => 'payment.reconcile', 'description' => 'Đối soát và xử lý sai lệch giao dịch thanh toán'],
            ['name' => 'payment.pay_own', 'description' => 'Khách hàng thanh toán hóa đơn của chính mình'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['name' => $p['name']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $allPerms = DB::table('permissions')
            ->whereIn('name', array_column($permissions, 'name'))
            ->pluck('id', 'name');

        // Role 1: Admin - Có toàn quyền
        if (DB::table('roles')->where('id', 1)->exists()) {
            foreach ($allPerms as $name => $pId) {
                if ($name !== 'payment.pay_own') {
                    DB::table('role_permissions')->updateOrInsert([
                        'role_id' => 1,
                        'permission_id' => $pId,
                    ], ['created_at' => now(), 'updated_at' => now()]);
                }
            }
        }

        // Role 2: Môi giới (Broker) - Xem, tạo QR, hủy giao dịch chờ của hợp đồng mình
        if (DB::table('roles')->where('id', 2)->exists()) {
            foreach (['payment.view', 'payment.qr', 'payment.cancel'] as $pName) {
                if (isset($allPerms[$pName])) {
                    DB::table('role_permissions')->updateOrInsert([
                        'role_id' => 2,
                        'permission_id' => $allPerms[$pName],
                    ], ['created_at' => now(), 'updated_at' => now()]);
                }
            }
        }

        // Role 3: Khách hàng (Customer) - Xem và thanh toán hóa đơn của chính mình
        if (DB::table('roles')->where('id', 3)->exists()) {
            foreach (['payment.view', 'payment.qr', 'payment.pay_own'] as $pName) {
                if (isset($allPerms[$pName])) {
                    DB::table('role_permissions')->updateOrInsert([
                        'role_id' => 3,
                        'permission_id' => $allPerms[$pName],
                    ], ['created_at' => now(), 'updated_at' => now()]);
                }
            }
        }

        // Role 4: Nhân viên kế toán / Staff (nếu có)
        if (DB::table('roles')->where('id', 4)->exists()) {
            foreach (['payment.view', 'payment.qr', 'payment.cancel'] as $pName) {
                if (isset($allPerms[$pName])) {
                    DB::table('role_permissions')->updateOrInsert([
                        'role_id' => 4,
                        'permission_id' => $allPerms[$pName],
                    ], ['created_at' => now(), 'updated_at' => now()]);
                }
            }
        }
    }

    public function down(): void
    {
        $permNames = ['payment.view', 'payment.qr', 'payment.cancel', 'payment.reconcile', 'payment.pay_own'];
        $permIds = DB::table('permissions')->whereIn('name', $permNames)->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }
};
