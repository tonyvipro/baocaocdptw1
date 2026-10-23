<?php

namespace App\Enums;

class InvoiceStatus
{
    public const UNPAID = 0;    // Chưa thanh toán
    public const PAID = 1;      // Đã thanh toán
    public const OVERDUE = 2;   // Quá hạn
    public const CANCELLED = 3; // Đã hủy

    public static function all(): array
    {
        return [
            self::UNPAID,
            self::PAID,
            self::OVERDUE,
            self::CANCELLED,
        ];
    }

    public static function label(int $status): string
    {
        return match ($status) {
            self::UNPAID => 'Chưa thanh toán',
            self::PAID => 'Đã thanh toán',
            self::OVERDUE => 'Quá hạn',
            self::CANCELLED => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    public static function badgeColor(int $status): string
    {
        return match ($status) {
            self::UNPAID => 'warning',  // Vàng/Cam
            self::PAID => 'success',    // Xanh lá
            self::OVERDUE => 'danger',   // Đỏ
            self::CANCELLED => 'secondary', // Xám
            default => 'light',
        };
    }
}
