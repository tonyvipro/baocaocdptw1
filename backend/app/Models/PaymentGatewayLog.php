<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentGatewayLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'payment_gateway_logs';

    protected $fillable = [
        'transaction_id',
        'gateway',
        'event',
        'payload',
        'signature_valid',
        'ip',
        'created_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'signature_valid' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
