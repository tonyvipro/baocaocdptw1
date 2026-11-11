<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Role as RoleModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserProtectionAndRoleTest extends TestCase
{
    use RefreshDatabase;

    private function seedRole(Role $role): void
    {
        if (!RoleModel::find($role->value)) {
            RoleModel::forceCreate([
                'id' => $role->value,
                'name' => $role->databaseName(),
                'description' => $role->description(),
            ]);
        }
    }

    private function createAdmin(string $email = 'admin@example.com', bool $isActive = true): User
    {
        $this->seedRole(Role::Admin);
        return User::create([
            'name' => 'Admin User',
            'email' => $email,
            'password' => bcrypt('password123'),
            'role_id' => Role::Admin->value,
            'is_active' => $isActive,
            'unit' => null,
        ])->refresh();
    }

    public function test_role_validation_accepts_valid_enum_and_rejects_invalid(): void
    {
        $admin = $this->createAdmin();
        $this->seedRole(Role::Customer);

        // role_id = 5 (Customer / Người thuê) -> Hợp lệ
        $resValid = $this->actingAs($admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Khách Thuê Nhà',
            'email' => 'customer@example.com',
            'password' => 'secret123',
            'role_id' => Role::Customer->value,
            'unit' => 'P-202',
        ]);
        $resValid->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'customer@example.com',
            'role_id' => 5,
            'unit' => 'P-202',
        ]);

        // role_id = 999 -> Không hợp lệ (fail Rule::enum)
        $resInvalid = $this->actingAs($admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Invalid Role User',
            'email' => 'invalid_role@example.com',
            'password' => 'secret123',
            'role_id' => 999,
        ]);
        $resInvalid->assertStatus(422)
            ->assertJsonValidationErrors(['role_id']);
    }

    public function test_unit_handling_supports_real_unit_or_null_when_not_needed(): void
    {
        $admin = $this->createAdmin();
        $this->seedRole(Role::Staff);
        $this->seedRole(Role::Customer);

        // User có căn hộ cụ thể
        $resWithUnit = $this->actingAs($admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Cư Dân A',
            'email' => 'cudan_a@example.com',
            'password' => 'secret123',
            'role_id' => Role::Customer->value,
            'unit' => 'A102',
        ]);
        $resWithUnit->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'cudan_a@example.com', 'unit' => 'A102']);

        // User không cần căn hộ (Staff / Admin / Broker)
        $resNullUnit = $this->actingAs($admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Nhân Viên B',
            'email' => 'staff_b@example.com',
            'password' => 'secret123',
            'role_id' => Role::Staff->value,
            'unit' => null,
        ]);
        $resNullUnit->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'staff_b@example.com', 'unit' => null]);
    }

    public function test_rule_1_blocks_self_deletion_with_403_cannot_delete_self(): void
    {
        $admin1 = $this->createAdmin('admin1@example.com');
        $admin2 = $this->createAdmin('admin2@example.com'); // Đảm bảo không vướng rule 2

        $response = $this->actingAs($admin1, 'sanctum')->deleteJson("/api/users/{$admin1->id}", [
            'version' => $admin1->version,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'CANNOT_DELETE_SELF',
                'message' => 'Bạn không thể tự xóa tài khoản của chính mình.',
            ]);

        $this->assertDatabaseHas('users', ['id' => $admin1->id, 'deleted_at' => null]);
    }

    public function test_rule_1_blocks_self_deactivation_with_403_cannot_deactivate_self(): void
    {
        $admin1 = $this->createAdmin('admin1@example.com');
        $admin2 = $this->createAdmin('admin2@example.com'); // Đảm bảo không vướng rule 2

        $response = $this->actingAs($admin1, 'sanctum')->putJson("/api/users/{$admin1->id}", [
            'is_active' => false,
            'version' => $admin1->version,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'CANNOT_DEACTIVATE_SELF',
                'message' => 'Bạn không thể tự khóa tài khoản của chính mình.',
            ]);

        $this->assertTrue((bool) $admin1->fresh()->is_active);
    }

    public function test_rule_1_blocks_self_demotion_via_update_and_assign_role_with_403(): void
    {
        $admin1 = $this->createAdmin('admin1@example.com');
        $admin2 = $this->createAdmin('admin2@example.com'); // Đảm bảo không vướng rule 2
        $this->seedRole(Role::Customer);

        // Tự hạ quyền qua PUT /api/users/{id}
        $resUpdate = $this->actingAs($admin1, 'sanctum')->putJson("/api/users/{$admin1->id}", [
            'role_id' => Role::Customer->value,
            'version' => $admin1->version,
        ]);
        $resUpdate->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'CANNOT_DEMOTE_SELF',
                'message' => 'Bạn không thể tự hạ quyền quản trị viên của chính mình.',
            ]);

        // Tự hạ quyền qua PUT /api/users/{id}/assign-role
        $resAssign = $this->actingAs($admin1, 'sanctum')->putJson("/api/users/{$admin1->id}/assign-role", [
            'role_id' => Role::Customer->value,
            'version' => $admin1->fresh()->version,
        ]);
        $resAssign->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'CANNOT_DEMOTE_SELF',
                'message' => 'Bạn không thể tự hạ quyền quản trị viên của chính mình.',
            ]);

        $this->assertEquals(Role::Admin->value, $admin1->fresh()->role_id);
    }

    public function test_rule_2_protects_last_active_admin_from_deletion_deactivation_demotion_with_422(): void
    {
        $onlyAdmin = $this->createAdmin('only_admin@example.com', true);
        $this->seedRole(Role::Staff);
        $this->seedRole(Role::Customer);

        // Cấp quyền quản lý tài khoản cho Staff để vượt qua ManagementAccess middleware
        config([
            'permissions.roles.'.Role::Staff->value => [
                'users.manage',
                'roles.manage',
            ]
        ]);

        $staffUser = User::create([
            'name' => 'Staff Manager',
            'email' => 'staff_manager@example.com',
            'password' => bcrypt('password123'),
            'role_id' => Role::Staff->value,
            'is_active' => true,
        ])->refresh();

        // Cố xóa Admin duy nhất -> HTTP 422 LAST_ACTIVE_ADMIN_PROTECTED
        $resDelete = $this->actingAs($staffUser, 'sanctum')->deleteJson("/api/users/{$onlyAdmin->id}", [
            'version' => $onlyAdmin->version,
        ]);
        $resDelete->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'LAST_ACTIVE_ADMIN_PROTECTED',
                'message' => 'Không thể xóa, khóa hoặc hạ quyền quản trị viên hoạt động cuối cùng.',
            ]);

        // Cố khóa Admin duy nhất -> HTTP 422 LAST_ACTIVE_ADMIN_PROTECTED
        $resDeactivate = $this->actingAs($staffUser, 'sanctum')->putJson("/api/users/{$onlyAdmin->id}", [
            'is_active' => false,
            'version' => $onlyAdmin->fresh()->version,
        ]);
        $resDeactivate->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'LAST_ACTIVE_ADMIN_PROTECTED',
            ]);

        // Cố hạ quyền Admin duy nhất -> HTTP 422 LAST_ACTIVE_ADMIN_PROTECTED
        $resDemote = $this->actingAs($staffUser, 'sanctum')->putJson("/api/users/{$onlyAdmin->id}/assign-role", [
            'role_id' => Role::Customer->value,
            'version' => $onlyAdmin->fresh()->version,
        ]);
        $resDemote->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'error_code' => 'LAST_ACTIVE_ADMIN_PROTECTED',
            ]);

        $freshAdmin = $onlyAdmin->fresh();
        $this->assertTrue((bool) $freshAdmin->is_active);
        $this->assertEquals(Role::Admin->value, $freshAdmin->role_id);
        $this->assertNull($freshAdmin->deleted_at);
    }

    public function test_admin_can_modify_or_delete_other_admin_when_multiple_active_admins_exist(): void
    {
        $admin1 = $this->createAdmin('admin1@example.com', true);
        $admin2 = $this->createAdmin('admin2@example.com', true);
        $this->seedRole(Role::Customer);

        // Admin 1 hạ quyền Admin 2 -> Thành công vì vẫn còn Admin 1 active
        $resDemote = $this->actingAs($admin1, 'sanctum')->putJson("/api/users/{$admin2->id}/assign-role", [
            'role_id' => Role::Customer->value,
            'version' => $admin2->version,
        ]);
        $resDemote->assertStatus(200);
        $this->assertEquals(Role::Customer->value, $admin2->fresh()->role_id);

        // Tạo lại admin3
        $admin3 = $this->createAdmin('admin3@example.com', true);

        // Admin 1 khóa Admin 3 -> Thành công vì vẫn còn Admin 1 active
        $resDeactivate = $this->actingAs($admin1, 'sanctum')->putJson("/api/users/{$admin3->id}", [
            'is_active' => false,
            'version' => $admin3->version,
        ]);
        $resDeactivate->assertStatus(200);
        $this->assertFalse((bool) $admin3->fresh()->is_active);

        // Tạo lại admin4
        $admin4 = $this->createAdmin('admin4@example.com', true);

        // Admin 1 xóa Admin 4 -> Thành công vì vẫn còn Admin 1 active
        $resDelete = $this->actingAs($admin1, 'sanctum')->deleteJson("/api/users/{$admin4->id}", [
            'version' => $admin4->version,
        ]);
        $resDelete->assertStatus(200);
        $this->assertSoftDeleted('users', ['id' => $admin4->id]);
    }

    public function test_unit_options_returns_real_units_from_properties_table(): void
    {
        $admin = $this->createAdmin();

        DB::table('properties')->insert([
            ['id' => 101, 'code' => 'UNIT-101', 'title' => 'Căn hộ Studio 101', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 102, 'code' => 'UNIT-102', 'title' => 'Căn hộ 2PN 102', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/unit-options');
        $res->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    ['id' => 101, 'code' => 'UNIT-101', 'title' => 'Căn hộ Studio 101'],
                    ['id' => 102, 'code' => 'UNIT-102', 'title' => 'Căn hộ 2PN 102'],
                ]
            ]);
    }
}
