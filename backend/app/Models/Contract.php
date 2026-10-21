<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'contract_code',
        'contract_name',
        'property_id',
        'broker_id',
        'customer_id',
        'start_date',
        'end_date',
        'deposit_amount',
        'rental_price',
        'currency',
        'party_a_info',
        'party_b_info',
        'tax_code',
        'terms',
        'status',
        'signing_method',
        'meeting_location',
        'meeting_time',
        'notary_office',
        'is_high_value',
    ];

    protected $casts = [
        'is_high_value' => 'boolean',
        'deposit_amount' => 'decimal:2',
        'rental_price' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'meeting_time' => 'datetime',
    ];

    // Hằng số nghiệp vụ gia hạn (Spec mục 3.2 & 5.5)
    public const GRACE_PERIOD_DAYS = 30; // Ân hạn 30 ngày sau khi hết hạn
    public const REMINDER_DAYS = [30, 15, 7]; // Các mốc nhắc nhở trước khi hết hạn (ngày)

    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function extensions()
    {
        return $this->hasMany(ContractExtension::class, 'contract_id');
    }

    public function documents()
    {
        return $this->hasMany(ContractDocument::class, 'contract_id');
    }

    /**
     * Ngưỡng giá trị lớn (High-Value Threshold): từ 5 Tỷ VNĐ hoặc cọc từ 500 Triệu VNĐ
     */
    public static function isHighValue($price, $deposit = 0)
    {
        return (floatval($price) >= 5000000000) || (floatval($deposit) >= 500000000);
    }

    /**
     * Kiểm tra xem BĐS có đang trong hợp đồng nào còn hiệu lực không
     */
    public static function checkActiveContractForProperty($propertyId, $excludeId = null)
    {
        $query = self::where('property_id', $propertyId)
            ->where('status', 1);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Tạo hợp đồng mới
     */
    public static function createNewContract($data)
    {
        return self::create($data);
    }
}
