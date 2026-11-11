<?php

namespace App\Services;

use App\Models\User;

final class Permissions
{
    public function forUser(User $user): array
    {
        if (!$user->is_active || $user->trashed()) return [];

        return config('permissions.roles.'.(int) $user->role_id, []);
    }

    public function allows(User $user, string $permission): bool
    {
        return in_array($permission, $this->forUser($user), true);
    }

    public function rolesFor(string $permission): array
    {
        return array_keys(array_filter(config('permissions.roles', []),
            fn (array $permissions) => in_array($permission, $permissions, true)));
    }
}
