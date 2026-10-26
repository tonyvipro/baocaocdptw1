<?php

namespace App\Enums;

class TransactionStatus
{
    public const SUCCESS = 1;
    public const PENDING = 0;
    public const FAILED = 2;
    public const REFUNDED = 3;

    public static function all(): array
    {
        return [
            self::SUCCESS,
            self::PENDING,
            self::FAILED,
            self::REFUNDED,
        ];
    }

    public static function label(int $status): string
    {
        return match ($status) {
            self::SUCCESS => 'Thành công',
            self::PENDING => 'Chờ xử lý',
            self::FAILED => 'Thất bại',
            self::REFUNDED => 'Đã hoàn',
            default => 'Không xác định',
        };
    }
}
