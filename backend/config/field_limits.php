<?php

return [
    'search' => [
        'max' => 100,
    ],
    'month' => [
        'format' => 'Y-m',
        'allowed_special' => ['all'],
    ],
    'status' => [
        'allowed' => ['paid', 'partial', 'overdue', 'unpaid', 'cancelled'],
    ],
    'sort' => [
        'allowed' => ['overdue_first', 'due_date_asc', 'due_date_desc', 'amount_asc', 'amount_desc'],
    ],
    'per_page' => [
        'allowed' => [10, 20, 50],
        'default' => 10,
    ],
    'payment' => [
        'amount' => [
            'min' => 0.01,
            'max' => 999999999999.99,
            'decimal_places' => 2,
        ],
        'reference_code' => [
            'max' => 100,
            'regex' => '/^[a-zA-Z0-9_\-\/\.\s]+$/',
        ],
        'note' => [
            'max' => 500,
        ],
    ],
    'invoice' => [
        'title' => [
            'max' => 255,
        ],
        'note' => [
            'max' => 2000,
        ],
        'cancel_reason' => [
            'min' => 3,
            'max' => 1000,
        ],
        'items' => [
            'max_items' => 50,
            'item_name' => ['max' => 255],
            'description' => ['max' => 255],
            'quantity' => ['min' => 0.01, 'max' => 100000],
            'unit_price' => ['min' => 0, 'max' => 999999999999.99],
        ],
    ],
    'deposit' => [
        'status' => [
            'allowed' => [
                'all',
                'unpaid',
                'partial_collected',
                'holding',
                'refund_due',
                'partial_refunded',
                'refunded',
                'deducted',
                'collected_any',
                'held_any',
            ],
        ],
        'sort' => [
            'allowed' => [
                'refund_due_first',
                'end_date_asc',
                'end_date_desc',
                'amount_asc',
                'amount_desc',
                'collection_date_desc',
            ],
        ],
        'amount' => [
            'min' => 0.01,
            'max' => 999999999999.99,
            'decimal_places' => 2,
        ],
        'notes' => [
            'max' => 1000,
        ],
        'reason' => [
            'max' => 500,
        ],
        'date_range_max_days' => 366,
    ],
];
