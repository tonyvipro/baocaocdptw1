<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'contract_extension.view', 'description' => 'Xem danh sách và lịch sử gia hạn hợp đồng'],
            ['name' => 'contract_extension.create', 'description' => 'Tạo và chỉnh sửa bản nháp gia hạn hợp đồng'],
            ['name' => 'contract_extension.submit', 'description' => 'Gửi yêu cầu gia hạn hợp đồng lên cấp trên duyệt'],
            ['name' => 'contract_extension.approve', 'description' => 'Phê duyệt hoặc từ chối yêu cầu gia hạn hợp đồng'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['name' => $p['name']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Gán quyền cho Admin (role_id = 1): toàn bộ 4 quyền (nếu role tồn tại)
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

        // Gán quyền cho Môi giới BĐS (role_id = 2): view, create, submit (nếu role tồn tại)
        if (DB::table('roles')->where('id', 2)->exists()) {
            $brokerPermIds = DB::table('permissions')->whereIn('name', [
                'contract_extension.view',
                'contract_extension.create',
                'contract_extension.submit',
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
    }

    public function down(): void
    {
        $names = [
            'contract_extension.view',
            'contract_extension.create',
            'contract_extension.submit',
            'contract_extension.approve',
        ];

        $permIds = DB::table('permissions')->whereIn('name', $names)->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }
};
