<?php

namespace App\Support;

final class PropertyPrice
{
    public static function format(float $price, bool $rent = false): string
    {
        $text = $price >= 1e9 ? round($price / 1e9, 2).' tỷ'
            : ($price >= 1e6 ? round($price / 1e6, 2).' triệu' : number_format($price, 0, ',', '.').' đồng');

        return $text.($rent ? '/tháng' : '');
    }
}
