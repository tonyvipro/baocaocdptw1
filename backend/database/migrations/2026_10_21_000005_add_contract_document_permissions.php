<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['name' => 'contract_document.view', 'description' => 'Xem danh sách và chi tiết tài liệu hợp đồng'],
            ['name' => 'contract_document.upload', 'description' => 'Tải lên tài liệu hợp đồng'],
            ['name' => 'contract_document.update', 'description' => 'Chỉnh sửa thông tin tài liệu hợp đồng'],
            ['name' => 'contract_document.delete', 'description' => 'Xóa mềm tài liệu hợp đồng'],
            ['name' => 'contract_document.download', 'description' => 'Tải xuống tài liệu hợp đồng'],
            ['name' => 'contract_document.view_own', 'description' => 'Khách hàng xem danh sách hợp đồng và tài liệu của chính mình'],
            ['name' => 'contract_document.download_own', 'description' => 'Khách hàng tải xuống tài liệu hợp đồng của chính mình'],
        ];

        foreach ($permissions as $p) {
            DB::table('permissions')->updateOrInsert(['name' => $p['name']], array_merge($p, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Gán quyền cho Admin (role_id = 1): toàn bộ 7 quyền (nếu role tồn tại)
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

        // Gán quyền cho Môi giới BĐS (role_id = 2): view, upload, update, delete, download
        if (DB::table('roles')->where('id', 2)->exists()) {
            $brokerPermIds = DB::table('permissions')->whereIn('name', [
                'contract_document.view',
                'contract_document.upload',
                'contract_document.update',
                'contract_document.delete',
                'contract_document.download',
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

        // Gán quyền cho Nhân viên (role_id = 4): view, upload, update, download
        if (DB::table('roles')->where('id', 4)->exists()) {
            $staffPermIds = DB::table('permissions')->whereIn('name', [
                'contract_document.view',
                'contract_document.upload',
                'contract_document.update',
                'contract_document.download',
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

        // Gán quyền cho Khách hàng (role_id = 5): view_own, download_own
        if (DB::table('roles')->where('id', 5)->exists()) {
            $customerPermIds = DB::table('permissions')->whereIn('name', [
                'contract_document.view_own',
                'contract_document.download_own',
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
            'contract_document.view',
            'contract_document.upload',
            'contract_document.update',
            'contract_document.delete',
            'contract_document.download',
            'contract_document.view_own',
            'contract_document.download_own',
        ];

        $permIds = DB::table('permissions')->whereIn('name', $names)->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permIds)->delete();
        DB::table('permissions')->whereIn('id', $permIds)->delete();
    }
};
