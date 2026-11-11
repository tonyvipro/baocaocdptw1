<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('users.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:250|unique:users,name',
            'email' => 'required|string|email|max:250|unique:users,email',
            'password' => 'required|string|min:8|max:32',
            'role_id' => ['required', 'integer', Rule::enum(Role::class)],
            'unit' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Tên người dùng này đã tồn tại trong hệ thống.',
            'email.unique' => 'Email này đã được sử dụng bởi một tài khoản khác.',
            'role_id.Illuminate\Validation\Rules\Enum' => 'Vai trò được chọn không hợp lệ trong hệ thống.',
        ];
    }
}

