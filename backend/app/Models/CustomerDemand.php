<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerDemand extends Model
{
    use SoftDeletes;

    public const STATUSES = ['processing' => 'Đang xử lý', 'consulting' => 'Đang tư vấn', 'matched' => 'Đã tìm thấy BĐS', 'completed' => 'Hoàn tất', 'cancelled' => 'Đã hủy'];

    protected $fillable = [
        'customer_id',
        'property_type_id',
        'category_id',
        'province_id',
        'district_id',
        'ward_id',
        'location_ids',
        'bedrooms',
        'bathrooms',
        'budget_min',
        'budget_max',
        'area',
        'status',
        'notes',
        'created_by',
    ];
    protected $attributes = ['version' => 1];
    protected $appends = ['code'];

    protected function casts(): array
    {
        return [
            'budget_min' => 'integer',
            'budget_max' => 'integer',
            'version' => 'integer',
            'category_id' => 'integer',
            'province_id' => 'integer',
            'district_id' => 'integer',
            'ward_id' => 'integer',
            'location_ids' => 'array',
            'bedrooms' => 'integer',
            'bathrooms' => 'integer',
        ];
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

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id')->withTrashed();
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }

    public function district()
    {
        return $this->belongsTo(District::class, 'district_id');
    }

    public function ward()
    {
        return $this->belongsTo(Ward::class, 'ward_id');
    }

    public function assignments()
    {
        return $this->hasMany(BrokerAssignment::class, 'requirement_id');
    }
}
