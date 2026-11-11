<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'phone',
        'unit',
        'avatar',
        'is_active',
        'dark_mode',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role_id' => 'integer',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'dark_mode' => 'boolean',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function hasPermission(string $permission): bool
    {
        return app(\App\Services\Permissions::class)->allows($this, $permission);
    }

    public function accessData(): array
    {
        return [
            'permissions' => app(\App\Services\Permissions::class)->forUser($this),
            'role_label' => \App\Enums\Role::tryFrom((int) $this->role_id)?->label() ?? 'Chưa phân quyền',
        ];
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class, 'customer_id');
    }

    public function brokeredContracts()
    {
        return $this->hasMany(Contract::class, 'broker_id');
    }

    public function uploadedContractDocuments()
    {
        return $this->hasMany(ContractDocument::class, 'uploaded_by');
    }
}
