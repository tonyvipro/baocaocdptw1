<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerDemand extends Model
{
    use SoftDeletes;

    public const STATUSES = ['processing' => 'Đang xử lý', 'consulting' => 'Đang tư vấn', 'matched' => 'Đã tìm thấy BĐS', 'completed' => 'Hoàn tất', 'cancelled' => 'Đã hủy'];

    protected $fillable = ['customer_id', 'property_type_id', 'budget_min', 'budget_max', 'area', 'status', 'notes', 'created_by'];
    protected $attributes = ['version' => 1];
    protected $appends = ['code'];

    protected function casts(): array
    {
        return ['budget_min' => 'decimal:0', 'budget_max' => 'decimal:0', 'version' => 'integer'];
    }

    public function getCodeAttribute(): string
    {
        return 'ND-'.(1000 + (int) $this->id);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class)->select(['id', 'name', 'phone', 'email', 'company', 'assigned_to']);
    }

    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class)->select(['id', 'name', 'status']);
    }
}
