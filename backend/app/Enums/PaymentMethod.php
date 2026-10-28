<?php

namespace App\Enums;

class PaymentMethod
{
    public const BANK_TRANSFER = 'bank_transfer';
    public const CASH = 'cash';
    public const MOMO = 'momo';
    public const ZALOPAY = 'zalopay';
    public const VNPAY = 'vnpay';
    public const SEPAY = 'sepay';
    public const MOCK = 'mock';

    public static function all(): array
    {
        return [
            self::BANK_TRANSFER,
            self::CASH,
            self::SEPAY,
            self::MOMO,
            self::ZALOPAY,
            self::VNPAY,
            self::MOCK,
        ];
    }

    public static function label(string $method): string
    {
        return match (strtolower($method)) {
            self::BANK_TRANSFER => 'Chuyển khoản ngân hàng',
            self::CASH => 'Tiền mặt',
            self::SEPAY => 'Quét mã VietQR (SePay)',
            self::MOMO => 'Ví điện tử MoMo',
            self::ZALOPAY => 'Ví điện tử ZaloPay',
            self::VNPAY => 'Cổng VNPAY',
            self::MOCK => 'Cổng giả lập (Mock)',
            default => 'Khác',
        };
    }
}
