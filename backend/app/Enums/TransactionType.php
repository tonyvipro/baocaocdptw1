<?php

namespace App\Enums;

class TransactionType
{
    public const PAYMENT = 'payment';                     // Thanh toán thu (hóa đơn / tiền cọc)
    public const DEPOSIT_REFUND = 'deposit_refund';       // Hoàn trả tiền cọc cho khách
    public const DEPOSIT_DEDUCTION = 'deposit_deduction'; // Khấu trừ tiền cọc bên cho thuê giữ lại

    public static function all(): array
    {
        return [
            self::PAYMENT,
            self::DEPOSIT_REFUND,
            self::DEPOSIT_DEDUCTION,
        ];
    }

    public static function label(string $type): string
    {
        return match (strtolower($type)) {
            self::PAYMENT => 'Thu tiền',
            self::DEPOSIT_REFUND => 'Hoàn trả tiền cọc',
            self::DEPOSIT_DEDUCTION => 'Khấu trừ tiền cọc',
            default => 'Giao dịch khác',
        };
    }
}

