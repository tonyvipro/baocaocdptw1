<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    public const STATUSES = ['new' => 'Chưa liên hệ', 'contacted' => 'Đã liên hệ', 'interested' => 'Quan tâm', 'negotiating' => 'Đang đàm phán', 'won' => 'Đã giao dịch', 'lost' => 'Ngừng theo dõi'];
    public const GROUPS = ['new' => 'Khách hàng mới', 'potential' => 'Tiềm năng', 'vip' => 'VIP', 'existing' => 'Khách hàng cũ'];
    public const TYPES = ['call' => 'Gọi điện', 'email' => 'Gửi email', 'meeting' => 'Gặp mặt / xem nhà', 'message' => 'Nhắn tin', 'note' => 'Ghi chú'];

    protected $fillable = ['name', 'company', 'source', 'email', 'phone', 'customer_group', 'status', 'notes', 'assigned_to', 'created_by', 'is_tracked'];
    protected $appends = ['code'];
    protected $attributes = ['version' => 1, 'is_tracked' => true];

    protected function casts(): array
    {
        return ['is_tracked' => 'boolean'];
    }

    public function getCodeAttribute(): string
    {
        return 'KH'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to')->withTrashed()->select(['id', 'name']);
    }

    public function interactions()
    {
        return $this->hasMany(CustomerInteraction::class);
    }

    public function activities()
    {
        return $this->hasMany(CustomerActivity::class);
    }

    public function lastInteraction()
    {
        return $this->hasOne(CustomerInteraction::class)->ofMany(['occurred_at' => 'max', 'id' => 'max']);
    }

    public function nextActivity()
    {
        return $this->hasOne(CustomerActivity::class)->ofMany(['scheduled_at' => 'min', 'id' => 'min'], fn ($query) => $query->where('status', 'pending'));
    }
}
