<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Role as RoleModel;

final class RoleCatalog
{
    public function all(): array
    {
        $stored = RoleModel::withCount('users')->get()->keyBy('id');

        return array_map(fn (Role $role) => [
            'id' => $role->value,
            'name' => $role->databaseName(),
            'label' => $role->label(),
            'description' => $role->description(),
            'is_default' => $role === Role::Customer,
            'users_count' => (int) ($stored->get($role->value)?->users_count ?? 0),
        ], Role::cases());
    }

    // Call only inside the authorized user-write transaction. GET /roles never writes.
    public function ensure(Role $role): void
    {
        RoleModel::query()->insertOrIgnore([
            'id' => $role->value, 'name' => $role->databaseName(),
            'description' => $role->description(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        RoleModel::query()->findOrFail($role->value);
    }
}
