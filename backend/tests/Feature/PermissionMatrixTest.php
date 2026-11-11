<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Role as RoleModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PermissionMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function account(Role $role): User
    {
        // forceCreate is necessary because role IDs are server-owned, not mass assignable.
        if (!RoleModel::find($role->value)) RoleModel::forceCreate(['id' => $role->value, 'name' => $role->databaseName()]);
        return User::create(['name' => $role->name, 'email' => strtolower($role->name).'@example.com',
            'password' => 'test-password', 'role_id' => $role->value, 'is_active' => true])->refresh();
    }

    public static function matrix(): array
    {
        // Independent expected matrix, intentionally not read from config under test.
        $admin = [Role::Admin];
        $crm = [Role::Admin, Role::Broker];
        $members = Role::cases();
        $groups = [
            '/api/users' => $admin, '/api/roles' => $admin,
            '/api/categories' => $admin, '/api/brokers' => $admin,
            '/api/broker-assignments' => $admin, '/api/dashboard/overview' => $admin,
            '/api/reports/statistics' => $admin, '/api/customers' => $crm,
            '/api/customers?view=tracking' => $crm, '/api/demands' => $crm,
            '/api/notifications' => $members, '/api/notifications/unread-count' => $members,
            '/api/user' => $members, '/api/me' => $members,
        ];
        $cases = [];
        foreach (Role::cases() as $role) {
            foreach ($groups as $url => $allowed) {
                $cases[$role->name.' '.$url] = [$role, $url, in_array($role, $allowed, true) ? 200 : 403];
            }
        }
        return $cases;
    }

    #[DataProvider('matrix')]
    public function test_each_role_calls_each_api_group_with_a_real_bearer_token(Role $role, string $url, int $status): void
    {
        $user = $this->account($role);
        $token = $user->createToken('matrix')->plainTextToken;
        $response = $this->withToken($token)->getJson($url)->assertStatus($status);
        if ($status === 403) $response->assertJsonPath('code', 'FORBIDDEN');
    }

    public function test_guest_and_denied_requests_always_return_json_even_without_accept_header(): void
    {
        $this->get('/api/users')->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
        $this->actingAs($this->account(Role::Owner), 'web')->get('/api/users')
            ->assertForbidden()->assertHeader('Content-Type', 'application/json');
    }

    public function test_identity_and_login_return_permissions_and_inactive_users_get_none(): void
    {
        $user = $this->account(Role::Broker);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'test-password'])
            ->assertOk()->assertJsonPath('user.permissions', $user->accessData()['permissions']);
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.permissions', $user->accessData()['permissions']);
        $this->getJson('/api/user')->assertOk()->assertJsonPath('permissions', $user->accessData()['permissions']);
        $user->update(['is_active' => false]);
        $this->assertSame([], $user->accessData()['permissions']);
    }

    public function test_permissions_are_recomputed_after_a_role_change_with_the_same_token(): void
    {
        $user = $this->account(Role::Admin);
        RoleModel::forceCreate(['id' => Role::Staff->value, 'name' => 'Staff']);
        $token = $user->createToken('role-change')->plainTextToken;
        $this->withToken($token)->getJson('/api/users')->assertOk();
        $user->update(['role_id' => Role::Staff->value]);
        auth()->forgetGuards();
        $this->withToken($token)->getJson('/api/users')->assertForbidden();
        $permissions = $this->withToken($token)->getJson('/api/me')->assertOk()->json('user.permissions');
        $this->assertNotContains('users.manage', $permissions);
    }

    public function test_catalog_lists_and_assigns_owner_staff_and_customer_even_when_rows_are_missing(): void
    {
        $admin = $this->account(Role::Admin);
        $target = $this->account(Role::Broker);
        $this->actingAs($admin, 'web');
        $this->getJson('/api/roles')->assertOk()->assertJsonCount(5, 'data')
            ->assertJsonPath('data.2.label', 'Owner (Chủ sở hữu)')
            ->assertJsonPath('data.3.label', 'Staff (Nhân viên)');
        $this->assertDatabaseMissing('roles', ['id' => Role::Staff->value]);
        foreach ([Role::Owner, Role::Staff, Role::Customer] as $index => $role) {
            $this->putJson('/api/users/'.$target->id.'/assign-role', ['role_id' => $role->value, 'version' => $index + 1])
                ->assertOk()->assertJsonPath('data.role_id', $role->value);
            $this->assertDatabaseHas('roles', ['id' => $role->value]);
        }
        $this->putJson('/api/users/'.$target->id.'/assign-role', ['role_id' => 999, 'version' => 4])->assertUnprocessable();
    }

    public function test_forbidden_writes_are_rejected_before_validation_or_version_mutation(): void
    {
        $user = $this->account(Role::Staff);
        $this->actingAs($user, 'web');
        foreach ([['POST', '/api/users'], ['PUT', '/api/users/'.$user->id],
            ['PUT', '/api/users/'.$user->id.'/assign-role'], ['POST', '/api/categories'],
            ['POST', '/api/brokers'], ['POST', '/api/broker-assignments'],
            ['POST', '/api/customers'], ['POST', '/api/demands']] as [$method, $url]) {
            $this->json($method, $url, [])->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
        }
        $this->assertDatabaseHas('users', ['id' => $user->id, 'version' => 1, 'role_id' => Role::Staff->value]);
    }

    public function test_user_editor_can_create_staff_and_change_it_to_owner(): void
    {
        $this->actingAs($this->account(Role::Admin), 'web');
        $id = $this->postJson('/api/users', ['name' => 'New Staff', 'email' => 'new-staff@example.com',
            'password' => 'test-password', 'role_id' => Role::Staff->value])
            ->assertCreated()->assertJsonPath('user.role_id', Role::Staff->value)->json('user.id');
        $this->putJson('/api/users/'.$id, ['role_id' => Role::Owner->value, 'version' => 1])
            ->assertOk()->assertJsonPath('user.role_id', Role::Owner->value);
    }

    public static function roles(): array
    {
        return array_map(fn (Role $role) => [$role], Role::cases());
    }

    #[DataProvider('roles')]
    public function test_each_role_can_update_its_profile_password_and_revoke_its_token(Role $role): void
    {
        $user = $this->account($role);
        $this->actingAs($user, 'web')->postJson('/api/profile', ['name' => 'Updated '.$role->name, 'version' => 1])
            ->assertOk();
        $this->postJson('/api/change-password', ['version' => 2, 'current_password' => 'test-password',
            'password' => 'new-test-password', 'password_confirmation' => 'new-test-password'])->assertOk();
        $token = $user->createToken('logout-matrix')->plainTextToken;
        auth('web')->logout();
        auth()->forgetGuards();
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        auth()->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_inactive_or_unassigned_accounts_cannot_enter_management(): void
    {
        $user = $this->account(Role::Admin);
        $user->update(['is_active' => false]);
        $this->actingAs($user, 'web')->getJson('/api/users')->assertUnauthorized();
        $user->update(['is_active' => true, 'role_id' => null]);
        $this->actingAs($user, 'web')->getJson('/api/users')->assertForbidden();
        $this->getJson('/api/me')->assertForbidden();
    }

    public function test_configuration_is_the_authority_for_both_api_access_and_user_permissions(): void
    {
        $user = $this->account(Role::Broker);
        config(['permissions.roles.2' => [...$user->accessData()['permissions'], 'categories.manage']]);
        $this->actingAs($user, 'web')->getJson('/api/categories')->assertOk();
        $this->assertContains('categories.manage', $this->getJson('/api/me')->assertOk()->json('user.permissions'));
    }
}
