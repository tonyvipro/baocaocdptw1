<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/** The API is authoritative; browser constraints are only an input aid. */
class ValidateInputPolicy
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->is('api/*')) return $next($request);

        $errors = [];
        $walk = function (array $values, string $prefix = '') use (&$walk, &$errors, $request) {
            foreach ($values as $key => $value) {
                $path = $prefix.$key;
                if (is_array($value)) {
                    // History snapshots are server-verified records, not editable form fields.
                    if ($request->is('api/history') && $path === 'property') continue;
                    $walk($value, $path.'.');
                    continue;
                }
                if ($value === null || $value === '') continue;
                $field = strtolower((string) $key);
                $password = str_contains($field, 'password');
                // Uploaded avatar bytes have their own MIME, size and decoding validation.
                if ($field === 'avatar' && is_string($value) && str_starts_with($value, 'data:image/')) {
                    if (strlen($value) > 3_000_000 || !preg_match('~^data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$~D', $value)
                        || @getimagesizefromstring(base64_decode(explode(',', $value, 2)[1] ?? '', true) ?: '') === false) {
                        $errors[$path] = ['Ảnh đại diện phải là JPEG, PNG hoặc WebP hợp lệ, tối đa 2 MB.'];
                    }
                    continue;
                }
                if (is_string($value) && mb_strlen($value) > 250) {
                    $errors[$path] = ['Thông tin không được vượt quá 250 ký tự.'];
                    continue;
                }
                if (preg_match('/(?:^|_)(?:phone|mobile|tel)$/', $field)) {
                    if (!is_string($value) || !preg_match('/^[0-9]{10,11}$/D', $value)) {
                        $errors[$path] = ['Số điện thoại phải có 10–11 chữ số, không chứa dấu hoặc chữ.'];
                    }
                }
                if (preg_match('/(?:^|_)email$/', $field)) {
                    $loginAlias = $request->is('api/login') && in_array($value, ['admin', 'administrator'], true);
                    if (!$loginAlias && (!is_string($value) || Validator::make(['email' => $value], ['email' => 'email:rfc'])->fails()
                        || !preg_match('/^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/D', $value))) {
                        $errors[$path] = ['Email không đúng định dạng (ví dụ: ten@gmail.com, ten@icloud.com).'];
                    }
                }
                // Do not strip and silently save hostile text. SQL queries remain parameterized.
                if (is_string($value) && !$password && preg_match('~<\s*/?\s*[a-z][^>]*>|<\?(?:php|=)|\b(?:javascript|vbscript)\s*:|\bon\w+\s*=|\bunion\s+(?:all\s+)?select\b|[\x27\x22]\s*(?:or|and)\s+[\x27\x22\d]+\s*=|;\s*(?:drop|truncate|delete|insert|update)\s+(?:table|from|into|\w+\s+set)\b~iu', $value)) {
                    $errors[$path] = ['Chỉ nhập văn bản, không nhập thẻ HTML, mã script hoặc câu lệnh can thiệp dữ liệu.'];
                }
            }
        };
        $walk($request->all());
        if ($errors) throw ValidationException::withMessages($errors);

        return $next($request);
    }
}
