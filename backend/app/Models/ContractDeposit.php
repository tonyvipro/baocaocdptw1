<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractDeposit extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contract_deposits';

    protected $fillable = [
        'contract_id',
        'invoice_id',
        'required_amount',
        'refund_due_date',
        'notes',
        'version',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'required_amount' => 'decimal:2',
        'refund_due_date' => 'date',
        'version' => 'integer',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

