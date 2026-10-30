<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Broker extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'phone',
        'email',
        'level',
        'deals_count',
        'total_commission',
        'status',
        'avatar',
        'notes',
    ];

    protected $casts = [
        'deals_count' => 'integer',
        'total_commission' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignments()
    {
        return $this->hasMany(BrokerAssignment::class, 'broker_id');
    }
}
