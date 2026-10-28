<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    | Tùy chọn cổng thanh toán mặc định: 'sepay', 'mock', 'momo', 'zalopay'
    */
    'default' => env('PAYMENT_GATEWAY', 'sepay'),

    /*
    | Thời gian hiệu lực của mã QR thanh toán (phút)
    */
    'qr_ttl_minutes' => (int) env('PAYMENT_QR_TTL_MINUTES', 15),

    /*
    | URL công khai frontend để điều hướng sau khi thanh toán
    */
    'app_public_url' => env('APP_PUBLIC_URL', 'http://localhost:3000'),

    /*
    | Cấu hình chi tiết các cổng
    */
    'gateways' => [
        'sepay' => [
            'api_key' => env('SEPAY_API_KEY', ''),
            'account_number' => env('SEPAY_ACCOUNT_NUMBER', env('SEPAY_ACCOUNT_NO', '1110222501')),
            'va_account' => env('SEPAY_VA_ACCOUNT', ''),
            'bank_name' => env('SEPAY_BANK_NAME', 'BIDV'),
            'account_name' => env('SEPAY_ACCOUNT_NAME', 'PHAM LE HOANG HAO'),
            'webhook_token' => env('SEPAY_WEBHOOK_TOKEN', ''),
            'min_amount' => (int) env('SEPAY_MIN_AMOUNT', 1000),
            'max_amount' => (int) env('SEPAY_MAX_AMOUNT', 500000000), // 500 triệu VNĐ
        ],

        'mock' => [
            'secret' => env('MOCK_PAYMENT_SECRET', 'mock-secret-key-3tvland'),
            'min_amount' => 1000,
            'max_amount' => 2000000000, // 2 tỷ VNĐ
        ],

        'momo' => [
            'partner_code' => env('MOMO_PARTNER_CODE', ''),
            'access_key' => env('MOMO_ACCESS_KEY', ''),
            'secret_key' => env('MOMO_SECRET_KEY', ''),
            'endpoint' => env('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create'),
            'query_endpoint' => env('MOMO_QUERY_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/query'),
            'min_amount' => 1000,
            'max_amount' => 50000000, // 50 triệu VNĐ đối với ví MoMo
        ],

        'zalopay' => [
            'app_id' => env('ZALOPAY_APP_ID', ''),
            'key1' => env('ZALOPAY_KEY1', ''),
            'key2' => env('ZALOPAY_KEY2', ''),
            'endpoint' => env('ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create'),
            'query_endpoint' => env('ZALOPAY_QUERY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/query'),
            'min_amount' => 1000,
            'max_amount' => 50000000,
        ],
    ],
];
