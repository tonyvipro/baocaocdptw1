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

    protected $fillable = ['name', 'company', 'source', 'email', 'phone', 'customer_group', 'status', 'notes', 'assigned_to', 'primary_broker_id', 'created_by', 'is_tracked', 'merged_into_id'];
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

    public function primaryBroker()
    {
        return $this->belongsTo(Broker::class, 'primary_broker_id')->withTrashed();
    }

    public function assignments()
    {
        return $this->hasMany(BrokerAssignment::class, 'customer_id');
    }

    public function demands()
    {
        return $this->hasMany(CustomerDemand::class);
    }

    public function mergedInto()
    {
        return $this->belongsTo(Customer::class, 'merged_into_id')->withTrashed();
    }

    public function mergedFrom()
    {
        return $this->hasMany(Customer::class, 'merged_into_id')->withTrashed();
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
