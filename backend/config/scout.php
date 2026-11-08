<?php

use App\Models\Property;

return [
    'driver' => env('SCOUT_DRIVER', 'null'),
    'prefix' => env('SCOUT_PREFIX', '3tvland_'),
    'queue' => env('SCOUT_QUEUE', false),
    'after_commit' => true,
    'chunk' => ['searchable' => 500, 'unsearchable' => 500],
    'soft_delete' => false,
    'identify' => false,

    'elasticsearch' => [
        'hosts' => [
            (function () {
                $host = env('ELASTICSEARCH_HOST', 'http://127.0.0.1:9200');
                if (file_exists('/.dockerenv') && (str_contains($host, '127.0.0.1') || str_contains($host, 'localhost'))) {
                    return 'http://elasticsearch:9200';
                }
                if (!file_exists('/.dockerenv') && str_contains($host, 'elasticsearch')) {
                    return 'http://127.0.0.1:9200';
                }
                return $host;
            })(),
        ],
        'index-settings' => [
            Property::class => [
                'pagination' => ['maxTotalHits' => 1000],
            ],
        ],
    ],

    'meilisearch' => [
        'host' => env('MEILISEARCH_HOST', 'http://127.0.0.1:7700'),
        'key' => env('MEILISEARCH_KEY'),
        'index-settings' => [
            Property::class => [
                'searchableAttributes' => [
                    'title', 'code', 'project', 'address', 'street',
                    'district', 'city', 'developer', 'type',
                ],
                'filterableAttributes' => ['status', 'expires_at', 'purpose', 'city', 'type', 'price', 'area', 'bedrooms'],
                'sortableAttributes' => ['price', 'area', 'created_at'],
                'pagination' => ['maxTotalHits' => 1000],
                'typoTolerance' => ['enabled' => true],
            ],
        ],
    ],
];
