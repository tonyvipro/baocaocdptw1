<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'role_id' => ['required', 'integer', Rule::enum(Role::class)],
            'note' => 'nullable|string|max:250',
            'last_updated_at' => 'nullable|string',
        ];
    }
}
