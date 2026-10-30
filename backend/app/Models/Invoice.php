<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\InvoiceStatus;
use App\Enums\InvoiceType;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoices';

    protected $attributes = [
        'version' => 1,
    ];

    protected $fillable = [
        'invoice_no',
        'contract_id',
        'issue_date',
        'title',
        'type',
        'amount',
        'due_date',
        'billing_period_start',
        'billing_period_end',
        'status',
        'version',
        'note',
        'cancel_reason',
        'paid_amount',
        'paid_at',
        'email_sent_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'billing_period_start' => 'date',
        'billing_period_end' => 'date',
        'paid_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'status' => 'integer',
        'version' => 'integer',
    ];

    protected $appends = [
        'remaining',
        'status_label',
        'type_label',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id')->orderBy('sort_order')->orderBy('id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'invoice_id')->orderBy('paid_at', 'desc');
    }

    public function deposit()
    {
        return $this->hasOne(ContractDeposit::class, 'invoice_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope hóa đơn tiền thuê (type = 'rent')
     */
    public function scopeRent($query)
    {
        return $query->where('type', InvoiceType::RENT);
    }

    /**
     * Lấy khách hàng gián tiếp từ hợp đồng
     */
    public function getCustomerAttribute()
    {
        return $this->contract?->customer;
    }

    /**
     * Số tiền còn nợ = amount - paid_amount (không âm)
     */
    public function getRemainingAttribute(): float
    {
        $amount = (float) ($this->amount ?? 0);
        $paid = (float) ($this->paid_amount ?? 0);
        return max(0.0, round($amount - $paid, 2));
    }

    public function getStatusLabelAttribute(): string
    {
        return InvoiceStatus::label($this->status);
    }

    public function getTypeLabelAttribute(): string
    {
        return InvoiceType::label($this->type ?? '');
    }
}
