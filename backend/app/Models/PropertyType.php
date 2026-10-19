<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyType extends Model
{
    protected $fillable = ['name', 'slug', 'parent_id', 'description', 'status'];

    protected function casts(): array
    {
        return ['status' => 'integer', 'parent_id' => 'integer'];
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
