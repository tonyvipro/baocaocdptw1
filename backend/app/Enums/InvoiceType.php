<?php

namespace App\Enums;

class InvoiceType
{
    public const RENT = 'rent';
    public const DEPOSIT = 'deposit';
    public const SERVICE = 'service';
    public const OTHER = 'other';
    public const SALE = 'sale';

    public static function all(): array
    {
        return [
            self::RENT,
            self::DEPOSIT,
            self::SERVICE,
            self::OTHER,
            self::SALE,
        ];
    }

    public static function label(string $type): string
    {
        return match (strtolower($type)) {
            self::RENT => 'Tiền thuê',
            self::DEPOSIT => 'Tiền cọc',
            self::SERVICE => 'Phí dịch vụ/tiện ích',
            self::OTHER => 'Khoản thu khác',
            self::SALE => 'Mua bán BĐS',
            default => 'Không xác định',
        };
    }
}
