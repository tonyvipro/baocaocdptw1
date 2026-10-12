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
    ];

    /**
     * Kiểm tra xem BĐS có đang trong hợp đồng nào còn hiệu lực không
     */
    public static function checkActiveContractForProperty($propertyId)
    {
        return self::where('property_id', $propertyId)
            ->where('status', 1)
            ->exists();
    }

    /**
     * Tạo hợp đồng mới
     */
    public static function createNewContract($data)
    {
        return self::create($data);
    }
}
