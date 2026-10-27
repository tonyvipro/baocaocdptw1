<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthIdentityTest extends TestCase
{
    use RefreshDatabase;

    private function account(int $role): User
    {
        Role::forceCreate(['id' => $role, 'name' => 'Role '.$role]);

        return User::create([
            'name' => 'Account '.$role,
            'email' => 'account'.$role.'@example.com',
            'password' => 'test-password',
            'role_id' => $role,
            'is_active' => true,
        ]);
    }

    public function test_guest_is_not_reported_as_an_existing_admin(): void
    {
        $this->account(1);

        $this->getJson('/api/me')->assertUnauthorized()->assertJsonMissingPath('user');
    }

    public function test_identity_parameters_cannot_replace_a_login(): void
    {
        $admin = $this->account(1);

        foreach (['user_id' => $admin->id, 'id' => $admin->id, 'email' => $admin->email] as $key => $value) {
            $this->getJson('/api/me?'.http_build_query([$key => $value]))->assertUnauthorized();
        }
    }

    public function test_real_web_session_returns_its_user_instead_of_the_admin(): void
    {
        $this->account(1);
        $customer = $this->account(5);

        $this->actingAs($customer, 'web')->getJson('/api/me')
            ->assertOk()->assertJsonPath('user.id', $customer->id)->assertJsonPath('user.role_id', 5);
    }

    public function test_valid_bearer_token_returns_its_user(): void
    {
        $this->account(1);
        $customer = $this->account(5);
        $token = $customer->createToken('identity-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()->assertJsonPath('user.id', $customer->id);
    }

    public function test_expired_bearer_token_does_not_fall_back_to_any_account(): void
    {
        $admin = $this->account(1);
        $token = $admin->createToken('expired-test', ['*'], now()->subMinute())->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }
}
