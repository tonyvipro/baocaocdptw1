<?php

namespace Tests\Feature;

use App\Models\{Role, User, Broker, Category};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ManagementAuditTest extends TestCase
{
    use RefreshDatabase;

    private function account(int $role = 1): User
    {
        if (!Role::find($role)) Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);
        return User::create(['name' => 'Account '.User::withTrashed()->count(),
            'email' => 'audit'.User::withTrashed()->count().'@icloud.com', 'role_id' => $role,
            'password' => Hash::make('Correct-password9'), 'is_active' => true])->refresh();
    }

    private function broker(array $overrides = []): array
    {
        return $overrides + ['code' => 'AUDIT-MG', 'name' => 'Môi giới mẫu', 'phone' => '0901234567',
            'email' => 'broker@icloud.com', 'level' => 'Senior', 'status' => 'active'];
    }

    public function test_management_apis_require_real_admin_permissions(): void
    {
        $urls = ['/api/users', '/api/roles', '/api/categories', '/api/brokers', '/api/broker-assignments',
            '/api/dashboard/overview', '/api/reports/statistics'];
        foreach ($urls as $url) $this->getJson($url)->assertUnauthorized();
        $this->actingAs($this->account(5));
        foreach ($urls as $url) $this->getJson($url)->assertForbidden();
        $this->getJson('/api/customers')->assertForbidden();
        $this->getJson('/api/demands')->assertForbidden();
    }

    public function test_all_management_searches_reject_251_characters_even_with_direct_requests(): void
    {
        $this->actingAs($this->account());
        foreach (['users', 'categories', 'brokers', 'broker-assignments', 'customers', 'demands', 'notifications'] as $path) {
            $this->getJson('/api/'.$path.'?'.http_build_query(['search' => str_repeat('ệ', 251)]))
                ->assertUnprocessable()->assertJsonValidationErrors('search');
        }
        $this->getJson('/api/search/properties?'.http_build_query(['q' => str_repeat('ệ', 251)]))
            ->assertUnprocessable()->assertJsonValidationErrors('q');
    }

    public function test_plain_text_rejects_scripts_and_injection_but_accepts_normal_punctuation(): void
    {
        $this->actingAs($this->account());
        foreach (['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', "' OR 1=1 --", 'javascript:alert(1)', 'x; DROP TABLE users'] as $name) {
            $this->postJson('/api/categories', ['name' => $name])->assertUnprocessable()->assertJsonValidationErrors('name');
        }
        $this->postJson('/api/categories', ['name' => "O'Connor & Nhà phố (Q.1)", 'description' => str_repeat('ệ', 250)])
            ->assertCreated();
    }

    public function test_email_supports_multiple_valid_domains_and_phone_requires_ascii_digits(): void
    {
        $this->actingAs($this->account());
        foreach (['ten@gmail.com', 'ten+demo@icloud.com', 'ten@company.com.vn'] as $index => $email) {
            $this->postJson('/api/brokers', $this->broker(['code' => 'MG-'.$index, 'email' => $email]))->assertCreated();
        }
        foreach (['ten@', 'ten@icloud', 'ten@@gmail.com', 'ten..test@gmail.com', 'ten@gmail.com<script>'] as $email) {
            $this->postJson('/api/brokers', $this->broker(['email' => $email]))->assertUnprocessable()->assertJsonValidationErrors('email');
        }
        foreach (['123456789', '123456789012', '090abc1234', '+84901234567', '０９０１２３４５６７', 901234567] as $phone) {
            $this->postJson('/api/brokers', $this->broker(['phone' => $phone]))->assertUnprocessable()->assertJsonValidationErrors('phone');
        }
    }

    public function test_user_updates_and_role_assignment_cannot_overwrite_a_stale_browser_snapshot(): void
    {
        $this->actingAs($this->account());
        $user = $this->account(5);
        $this->putJson('/api/users/'.$user->id, ['version' => 1, 'name' => 'Latest name', 'email' => 'latest@icloud.com'])
            ->assertOk()->assertJsonPath('user.version', 2);
        $this->putJson('/api/users/'.$user->id, ['version' => 1, 'name' => 'Stale name'])->assertConflict()->assertJsonPath('code', 'STALE_VERSION');
        $this->putJson('/api/users/'.$user->id.'/assign-role', ['version' => 1, 'role_id' => 1])->assertConflict();
        $this->putJson('/api/users/'.$user->id.'/assign-role', ['role_id' => 1])->assertConflict();
        $this->putJson('/api/users/'.$user->id.'/assign-role', ['version' => 2, 'role_id' => 1])->assertOk()->assertJsonPath('data.version', 3);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Latest name', 'version' => 3]);
    }

    public function test_category_broker_and_assignment_versions_block_stale_edit_delete_and_status_changes(): void
    {
        $this->actingAs($this->account());
        $category = $this->postJson('/api/categories', ['name' => 'Căn hộ'])->assertCreated()->json('data.id');
        $this->putJson('/api/categories/'.$category, ['version' => 1, 'name' => 'Nhà phố'])->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/categories/'.$category.'/status', ['version' => 1])->assertConflict();
        $this->deleteJson('/api/categories/'.$category, ['version' => 1])->assertConflict();
        $broker = $this->postJson('/api/brokers', $this->broker())->assertCreated()->json('data.id');
        $this->putJson('/api/brokers/'.$broker, $this->broker(['version' => 1, 'name' => 'Latest broker']))->assertOk()->assertJsonPath('data.version', 2);
        $this->putJson('/api/brokers/'.$broker, $this->broker(['version' => 1]))->assertConflict();
        $assignmentData = ['request_code' => 'YC-AUDIT', 'customer_name' => 'Khách mẫu', 'customer_phone' => '01234567890',
            'customer_email' => 'customer@icloud.com', 'property_location' => 'Quận 1', 'broker_id' => $broker,
            'assigned_date' => now()->toDateString(), 'status' => 'pending'];
        $assignment = $this->postJson('/api/broker-assignments', $assignmentData)->assertCreated()->json('data.id');
        $this->putJson('/api/broker-assignments/'.$assignment, ['version' => 1, 'notes' => 'Newest'] + $assignmentData)->assertOk()->assertJsonPath('data.version', 2);
        $this->patchJson('/api/broker-assignments/'.$assignment.'/cancel', ['version' => 1])->assertConflict();
        $this->patchJson('/api/broker-assignments/'.$assignment.'/cancel', ['version' => 2])->assertOk()->assertJsonPath('data.version', 3);
    }

    public function test_failed_validation_does_not_consume_a_record_revision(): void
    {
        $this->actingAs($this->account());
        $category = Category::create(['name' => 'Original', 'slug' => 'original', 'status' => 'active'])->refresh();
        $this->putJson('/api/categories/'.$category->id, ['version' => 1, 'name' => ''])->assertUnprocessable();
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Original', 'version' => 1]);
    }

    public function test_profile_and_password_changes_require_a_fresh_revision_and_correct_password(): void
    {
        $admin = $this->account();
        $this->actingAs($admin);
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.version', 1);
        $this->postJson('/api/profile', ['name' => 'Newest profile', 'version' => 1])->assertOk()->assertJsonPath('user.version', 2);
        $this->postJson('/api/profile', ['name' => 'Stale profile', 'version' => 1])->assertConflict();
        $this->postJson('/api/change-password', ['version' => 1, 'current_password' => 'Correct-password9',
            'password' => 'New-password9', 'password_confirmation' => 'New-password9'])->assertConflict();
        $this->postJson('/api/change-password', ['version' => 2, 'current_password' => 'Correct-password9',
            'password' => 'New-password9', 'password_confirmation' => 'New-password9'])->assertOk()->assertJsonPath('version', 3);
        foreach (['Admin@123456', 'admin', 'admin123', '123456', 'Correct-password9'] as $password) {
            $this->postJson('/api/login', ['email' => $admin->email, 'password' => $password])->assertUnauthorized();
        }
        $this->postJson('/api/login', ['email' => $admin->email, 'password' => 'New-password9'])->assertOk();
    }

    public function test_last_active_admin_cannot_be_deleted_locked_or_demoted(): void
    {
        $admin = $this->account(); $this->account(5);
        $this->actingAs($admin);
        $this->deleteJson('/api/users/'.$admin->id, ['version' => 1])->assertUnprocessable();
        $this->putJson('/api/users/'.$admin->id, ['version' => 1, 'is_active' => false])->assertUnprocessable();
        $this->putJson('/api/users/'.$admin->id.'/assign-role', ['version' => 1, 'role_id' => 5])->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role_id' => 1, 'is_active' => true, 'version' => 1]);
    }

    public function test_reports_validate_periods_and_date_ranges_before_querying(): void
    {
        $this->actingAs($this->account());
        foreach ([['report_type' => 'invalid'], ['report_period' => 'invalid'], ['report_period' => 'custom'],
            ['report_period' => 'custom', 'start_date' => '2026-10-27', 'end_date' => '2026-10-20'],
            ['report_period' => 'custom', 'start_date' => 'garbage', 'end_date' => '2026-10-20']] as $query) {
            $this->getJson('/api/reports/statistics?'.http_build_query($query))->assertUnprocessable();
        }
    }

    public function test_registration_cannot_choose_admin_and_login_cannot_create_one(): void
    {
        $this->postJson('/api/login', ['email' => 'admin', 'password' => 'admin'])->assertUnauthorized();
        $this->assertDatabaseCount('users', 0);
        $this->postJson('/api/register', ['name' => 'New customer', 'email' => 'new@icloud.com',
            'password' => 'Password123', 'password_confirmation' => 'Password123', 'role_id' => 1, 'is_active' => true])
            ->assertCreated()->assertJsonPath('user.role_id', 5);
        $this->assertDatabaseMissing('users', ['role_id' => 1]);
    }

    public function test_dashboard_and_report_read_real_database_and_reject_bad_filters(): void
    {
        $this->actingAs($this->account());
        $this->getJson('/api/dashboard/overview')->assertOk();
        $this->getJson('/api/reports/statistics?report_type=overview&report_period=this_month')->assertOk();
    }

    public function test_two_bearer_sessions_must_reload_after_the_first_session_saves(): void
    {
        $admin = $this->account();
        $first = $admin->createToken('browser-a')->plainTextToken;
        $second = $admin->createToken('browser-b')->plainTextToken;
        $category = Category::create(['name' => 'Original', 'slug' => 'two-sessions', 'status' => 'active']);
        $url = '/api/categories/'.$category->id;
        $snapshotA = $this->withToken($first)->getJson($url)->assertOk()->json('data');
        $snapshotB = $this->withToken($second)->getJson($url)->assertOk()->json('data');
        $this->withToken($first)->putJson($url, ['version' => $snapshotA['version'], 'name' => 'Browser A'])
            ->assertOk()->assertJsonPath('data.version', 2);
        $this->withToken($second)->putJson($url, ['version' => $snapshotB['version'], 'name' => 'Browser B'])
            ->assertConflict()->assertJsonPath('code', 'STALE_VERSION');
        $fresh = $this->withToken($second)->getJson($url)->assertOk()->json('data');
        $this->withToken($second)->putJson($url, ['version' => $fresh['version'], 'name' => 'Browser B after reload'])
            ->assertOk()->assertJsonPath('data.version', 3);
    }

    public function test_assignment_rejects_inactive_brokers_and_completed_assignment_cannot_be_cancelled(): void
    {
        $this->actingAs($this->account());
        $broker = $this->postJson('/api/brokers', $this->broker(['status' => 'inactive']))->assertCreated()->json('data.id');
        $data = ['request_code' => 'YC-LIFECYCLE', 'customer_name' => 'Khách', 'property_location' => 'Quận 1',
            'broker_id' => $broker, 'assigned_date' => now()->toDateString(), 'status' => 'completed'];
        $this->postJson('/api/broker-assignments', $data)->assertUnprocessable()->assertJsonValidationErrors('broker_id');
        Broker::find($broker)->update(['status' => 'active']);
        $assignment = $this->postJson('/api/broker-assignments', $data)->assertCreated()->json('data.id');
        $this->patchJson('/api/broker-assignments/'.$assignment.'/cancel', ['version' => 1])->assertUnprocessable();
        $this->assertDatabaseHas('broker_assignments', ['id' => $assignment, 'status' => 'completed', 'version' => 1]);
        $this->postJson('/api/broker-assignments', $data)->assertUnprocessable()->assertJsonValidationErrors('request_code');
    }
}
