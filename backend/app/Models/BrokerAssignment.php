<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BrokerAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'request_code',
        'customer_name',
        'customer_phone',
        'customer_email',
        'property_location',
        'broker_id',
        'assigned_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date:Y-m-d',
    ];

    public function broker()
    {
        return $this->belongsTo(Broker::class, 'broker_id');
    }
}
