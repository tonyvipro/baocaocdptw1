<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyType extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'status' => 'integer',
        'parent_id' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(PropertyType::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(PropertyType::class, 'parent_id');
    }

    public function properties()
    {
        return $this->hasMany(Property::class, 'property_type_id');
    }
}
