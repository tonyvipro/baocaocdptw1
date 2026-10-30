<?php

namespace App\Enums;

class DepositDisplayStatus
{
    public const UNPAID = 'unpaid';                       // Chưa thu (collected = 0)
    public const PARTIAL_COLLECTED = 'partial_collected'; // Thu một phần (0 < collected < required, chưa hoàn/khấu trừ, chưa đến hạn)
    public const HOLDING = 'holding';                     // Đang giữ (held > 0, chưa đến hạn hoàn trả, chưa hoàn/khấu trừ)
    public const REFUND_DUE = 'refund_due';               // Cần hoàn trả (held > 0 và đến hạn hoàn trả)
    public const PARTIAL_REFUNDED = 'partial_refunded';   // Hoàn một phần (held > 0 và (refunded + deducted) > 0, chưa đến hạn hoặc đang xử lý)
    public const REFUNDED = 'refunded';                   // Đã hoàn trả (held = 0 và refunded > 0)
    public const DEDUCTED = 'deducted';                   // Đã khấu trừ (held = 0, refunded = 0, deducted > 0)

    public static function all(): array
    {
        return [
            self::UNPAID,
            self::PARTIAL_COLLECTED,
            self::HOLDING,
            self::REFUND_DUE,
            self::PARTIAL_REFUNDED,
            self::REFUNDED,
            self::DEDUCTED,
        ];
    }

    public static function label(string $status): string
    {
        return match ($status) {
            self::UNPAID => 'Chưa thu',
            self::PARTIAL_COLLECTED => 'Thu một phần',
            self::HOLDING => 'Đang giữ',
            self::REFUND_DUE => 'Cần hoàn trả',
            self::PARTIAL_REFUNDED => 'Hoàn một phần',
            self::REFUNDED => 'Đã hoàn trả',
            self::DEDUCTED => 'Đã khấu trừ',
            default => 'Không xác định',
        };
    }

    public static function badgeColor(string $status): string
    {
        return match ($status) {
            self::REFUNDED => 'success',          // Xanh lá
            self::HOLDING => 'primary',           // Xanh dương
            self::REFUND_DUE => 'danger',         // Đỏ
            self::PARTIAL_COLLECTED,
            self::PARTIAL_REFUNDED,
            self::DEDUCTED => 'warning',          // Vàng / Cam
            self::UNPAID => 'secondary',          // Xám
            default => 'secondary',
        };
    }
}

