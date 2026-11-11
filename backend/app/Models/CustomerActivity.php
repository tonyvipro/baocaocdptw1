<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerActivity extends Model
{
    protected $fillable = [
        'customer_id',
        'created_by',
        'assigned_to',
        'type',
        'title',
        'scheduled_at',
        'status',
        'result',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => \App\Casts\UtcDateTime::class,
            'completed_at' => \App\Casts\UtcDateTime::class,
            'assigned_to' => 'integer',
            'created_by' => 'integer',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to')->select(['id', 'name']);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by')->select(['id', 'name']);
    }
}
