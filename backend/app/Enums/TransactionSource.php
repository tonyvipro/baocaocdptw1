<?php

namespace App\Enums;

class TransactionSource
{
    public const MANUAL = 'manual';
    public const GATEWAY = 'gateway';

    public static function all(): array
    {
        return [
            self::MANUAL,
            self::GATEWAY,
        ];
    }

    public static function label(string $source): string
    {
        return match (strtolower($source)) {
            self::MANUAL => 'Nhập tay',
            self::GATEWAY => 'Cổng thanh toán',
            default => 'Khác',
        };
    }
}
