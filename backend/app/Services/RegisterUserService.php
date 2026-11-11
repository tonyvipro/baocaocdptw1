<?php

namespace App\Services;

use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterUserService
{
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            Role::query()->insertOrIgnore([
                'id' => Role::CUSTOMER_ID,
                'name' => 'Customer',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $role = Role::query()->findOrFail(Role::CUSTOMER_ID);
            $user = $role->users()->create([
                'name' => trim($data['name']),
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
                'dark_mode' => false,
            ]);
            $user->setRelation('role', $role);

            return [
                'user' => $user,
                'token' => $user->createToken('auth_token')->plainTextToken,
            ];
        });
    }
}
