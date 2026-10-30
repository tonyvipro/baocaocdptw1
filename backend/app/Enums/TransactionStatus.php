<?php

namespace App\Enums;

class TransactionStatus
{
    public const PENDING = 0;       // Chờ xử lý
    public const SUCCESS = 1;       // Thành công
    public const FAILED = 2;        // Thất bại
    public const REFUNDED = 3;      // Đã hoàn
    public const EXPIRED = 4;       // Hết hạn
    public const CANCELLED = 5;     // Đã hủy
    public const RECONCILE = 6;     // Cần đối soát

    public static function all(): array
    {
        return [
            self::PENDING,
            self::SUCCESS,
            self::FAILED,
            self::REFUNDED,
            self::EXPIRED,
            self::CANCELLED,
            self::RECONCILE,
        ];
    }

    public static function label(int $status): string
    {
        return match ($status) {
            self::PENDING => 'Chờ xử lý',
            self::SUCCESS => 'Thành công',
            self::FAILED => 'Thất bại',
            self::REFUNDED => 'Đã hoàn tiền',
            self::EXPIRED => 'Hết hạn',
            self::CANCELLED => 'Đã hủy',
            self::RECONCILE => 'Cần đối soát',
            default => 'Không xác định',
        };
    }
}
