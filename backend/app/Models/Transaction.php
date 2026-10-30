<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Enums\TransactionSource;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'transactions';

    protected $fillable = [
        'invoice_id',
        'transaction_code',
        'amount',
        'source',
        'status',
        'payment_method',
        'reference_code',
        'paid_at',
        'note',
        'recorded_by',
        'client_token',
        'gateway',
        'gateway_order_id',
        'gateway_txn_id',
        'qr_content',
        'pay_url',
        'expires_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'status' => 'integer',
    ];

    protected $appends = [
        'payment_method_label',
        'status_label',
        'source_label',
    ];

    protected static function booted()
    {
        static::creating(function ($tx) {
            if (empty($tx->transaction_code)) {
                $dateStr = $tx->paid_at ? \Carbon\Carbon::parse($tx->paid_at)->format('Ymd') : \Carbon\Carbon::today()->format('Ymd');
                $tx->transaction_code = 'TXN-' . $dateStr . '-' . strtoupper(\Illuminate\Support\Str::random(6));
            }
            if (empty($tx->source)) {
                $tx->source = TransactionSource::MANUAL;
            }
            if (!isset($tx->status)) {
                $tx->status = TransactionStatus::SUCCESS;
            }
        });
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function gatewayLogs()
    {
        return $this->hasMany(PaymentGatewayLog::class, 'transaction_id');
    }

    /**
     * Scope chỉ lấy các giao dịch thành công (status = 1)
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', TransactionStatus::SUCCESS);
    }

    /**
     * Scope lấy các giao dịch đang chờ (status = 0)
     */
    public function scopePending($query)
    {
        return $query->where('status', TransactionStatus::PENDING);
    }

    public function getPaymentMethodLabelAttribute(): string
    {
        return PaymentMethod::label($this->payment_method ?? '');
    }

    public function getStatusLabelAttribute(): string
    {
        return TransactionStatus::label($this->status ?? TransactionStatus::SUCCESS);
    }

    public function getSourceLabelAttribute(): string
    {
        return TransactionSource::label($this->source ?? TransactionSource::MANUAL);
    }
}
