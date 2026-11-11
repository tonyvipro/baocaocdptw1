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
        'customer_id',
        'requirement_id',
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
        'customer_id' => 'integer',
        'requirement_id' => 'integer',
    ];

    protected $appends = [
        'is_primary',
    ];

    public function broker()
    {
        return $this->belongsTo(Broker::class, 'broker_id')->withTrashed();
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id')->withTrashed();
    }

    public function requirement()
    {
        return $this->belongsTo(CustomerDemand::class, 'requirement_id')->withTrashed();
    }

    /**
     * Xác định môi giới xử lý yêu cầu có phải là người phụ trách chính của khách hàng hay không
     */
    public function getIsPrimaryAttribute(): bool
    {
        if (!$this->customer_id) {
            return false;
        }

        $customer = $this->relationLoaded('customer') ? $this->customer : Customer::find($this->customer_id);
        if (!$customer) {
            return false;
        }

        // Khớp theo primary_broker_id hoặc user_id của môi giới
        if ($customer->primary_broker_id && (int) $customer->primary_broker_id === (int) $this->broker_id) {
            return true;
        }

        $broker = $this->relationLoaded('broker') ? $this->broker : Broker::withTrashed()->find($this->broker_id);
        if ($broker && $broker->user_id && (int) $customer->assigned_to === (int) $broker->user_id) {
            return true;
        }

        return false;
    }
}
