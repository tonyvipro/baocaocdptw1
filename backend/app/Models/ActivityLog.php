<?php

namespace App\Models;

use App\Enums\Role as RoleEnum;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'old_data' => 'array',
            'new_data' => 'array',
            'actor_snapshot' => 'array',
            'subject_snapshot' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed()->select(['id', 'name', 'role_id']);
    }

    /**
     * Lấy tên người thực hiện (Ưu tiên bản ghi trực tiếp, snapshot, hoặc user quan hệ)
     */
    public function getResolvedActorNameAttribute(): string
    {
        if (!empty($this->actor_name)) {
            return $this->actor_name;
        }

        if (!empty($this->actor_snapshot['name'])) {
            return $this->actor_snapshot['name'];
        }

        if ($this->user) {
            return $this->user->name;
        }

        return 'Hệ thống';
    }

    /**
     * Lấy vai trò người thực hiện tại thời điểm thao tác
     */
    public function getResolvedActorRoleAttribute(): string
    {
        if (!empty($this->actor_role)) {
            return $this->actor_role;
        }

        if (!empty($this->actor_snapshot['role_name'])) {
            return $this->actor_snapshot['role_name'];
        }

        if ($this->user && $this->user->role_id) {
            return RoleEnum::tryFrom((int) $this->user->role_id)?->label() ?? 'Người dùng';
        }

        return 'Người dùng';
    }

    /**
     * Chuẩn bị mảng snapshot người thực hiện từ User model
     */
    public static function extractActorSnapshot(?User $actor): array
    {
        if (!$actor) {
            return [
                'actor_id' => null,
                'actor_name' => 'Hệ thống',
                'actor_role' => 'Hệ thống',
                'actor_snapshot' => null,
            ];
        }

        $roleName = $actor->role?->name
            ?? (RoleEnum::tryFrom((int) $actor->role_id)?->label() ?? 'Người dùng');

        return [
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'actor_role' => $roleName,
            'actor_snapshot' => [
                'id' => $actor->id,
                'name' => $actor->name,
                'email' => $actor->email,
                'role_id' => $actor->role_id,
                'role_name' => $roleName,
            ],
        ];
    }
}
