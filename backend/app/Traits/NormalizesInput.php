<?php

namespace App\Traits;

use Normalizer;

trait NormalizesInput
{
    /**
     * Chuẩn hóa dữ liệu input trước khi validation (Spec 3.11a)
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();
        $this->replace($this->normalizeRecursive($input));
    }

    /**
     * Đệ quy chuẩn hóa các phần tử trong mảng dữ liệu
     */
    protected function normalizeRecursive(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map([$this, 'normalizeRecursive'], $value);
        }

        if (is_string($value)) {
            return $this->normalizeString($value);
        }

        return $value;
    }

    /**
     * Chuẩn hóa một chuỗi:
     * 1. Loại bỏ null byte và các ký tự điều khiển (trừ \r, \n, \t)
     * 2. Chuẩn hóa Unicode về dạng NFC (Normal Form C)
     * 3. Trim khoảng trắng 2 đầu
     */
    protected function normalizeString(string $value): string
    {
        // 1. Loại bỏ null byte và ký tự điều khiển lạ
        $cleaned = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
        if ($cleaned === null) {
            $cleaned = $value;
        }

        // 2. Chuẩn hóa Unicode NFC (tránh lỗi tiếng Việt tổ hợp NFD)
        if (class_exists(Normalizer::class) && Normalizer::isNormalized($cleaned, Normalizer::FORM_D)) {
            $normalized = Normalizer::normalize($cleaned, Normalizer::FORM_C);
            if ($normalized !== false) {
                $cleaned = $normalized;
            }
        } elseif (class_exists(Normalizer::class)) {
            $normalized = Normalizer::normalize($cleaned, Normalizer::FORM_C);
            if ($normalized !== false) {
                $cleaned = $normalized;
            }
        }

        // 3. Trim 2 đầu
        return trim($cleaned);
    }
}
