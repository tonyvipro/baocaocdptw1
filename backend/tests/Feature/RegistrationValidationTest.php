<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationValidationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Người dùng thử',
            'email' => 'registration@example.com',
            'phone' => '0901234567',
            'password' => 'test-password',
            'password_confirmation' => 'test-password',
        ], $overrides);
    }

    public function test_registration_rejects_non_digits_and_phone_lengths_outside_ten_to_eleven(): void
    {
        foreach (['123456789', '123456789012', '090abc4567', '090-1234567', '+84901234567', '０９０１２３４５６７', 901234567] as $phone) {
            $this->postJson('/api/register', $this->payload(['phone' => $phone]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('phone');
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_accepts_ten_and_eleven_digits_and_a_250_character_name(): void
    {
        foreach (['0901234567', '01234567890'] as $index => $phone) {
            $this->postJson('/api/register', $this->payload([
                'name' => str_repeat('ệ', 250),
                'email' => "registration{$index}@example.com",
                'phone' => $phone,
                'password' => str_repeat('p', 32),
                'password_confirmation' => str_repeat('p', 32),
            ]))->assertCreated()->assertJsonPath('user.phone', $phone);
        }
        $this->assertDatabaseCount('users', 2);
    }

    public function test_registration_rejects_overlong_fields_even_when_posted_directly(): void
    {
        foreach ([
            ['name' => str_repeat('ệ', 251)],
            ['email' => str_repeat('a', 251).'@example.com'],
            ['password' => str_repeat('p', 33), 'password_confirmation' => str_repeat('p', 33)],
            ['password_confirmation' => str_repeat('p', 251)],
        ] as $overrides) {
            $this->postJson('/api/register', $this->payload($overrides))
                ->assertUnprocessable()
                ->assertJsonValidationErrors(array_keys($overrides));
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_phone_remains_optional(): void
    {
        $this->postJson('/api/register', $this->payload(['phone' => '']))
            ->assertCreated()->assertJsonPath('user.phone', null);
    }
}
