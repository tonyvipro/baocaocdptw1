<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'developer', // Vinhomes, Novaland, Sun Group, Khang Điền, Nam Long, Hưng Thịnh, Him Lam, FLC, BIM Group, Kim Oanh
        'project',
        'purpose', // 'sale', 'rent', 'project'
        'type', // 'Căn hộ cao cấp', 'Nhà phố / Liền kề', 'Biệt thự nghỉ dưỡng', 'Đất nền dự án'
        'price_sale',
        'price_sale_text',
        'price_rent',
        'price_rent_text',
        'deposit',
        'deposit_text',
        'unit_price',
        'legal',
        'rent_period_min',
        'furniture',
        'management_fee',
        'available_date',
        'area',
        'bedrooms',
        'bathrooms',
        'street',
        'district',
        'city',
        'lat',
        'lng',
        'image',
        'badge',
        'badge_class',
        'owner_name',
        'owner_phone',
        'status', // 'available', 'rented', 'sold', 'pending'
    ];

    protected $casts = [
        'price_sale' => 'decimal:2',
        'price_rent' => 'decimal:2',
        'deposit' => 'decimal:2',
        'area' => 'float',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'lat' => 'float',
        'lng' => 'float',
    ];
}
