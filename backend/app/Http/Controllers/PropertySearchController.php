<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Meilisearch\Endpoints\Indexes;
use Meilisearch\Exceptions\ExceptionInterface;

class PropertySearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $input = $request->validate([
            'q' => ['nullable', 'string', 'max:250'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:24'],
            'catalog' => ['sometimes', 'boolean'],
        ]);
        $text = trim($input['q'] ?? '');
        $perPage = (int) ($input['per_page'] ?? 8);
        $page = (int) ($input['page'] ?? 1);
        if ($text === '') {
            return response()->json(['data' => [], 'meta' => [
                'query' => '', 'current_page' => 1, 'last_page' => 1, 'per_page' => $perPage, 'total' => 0,
            ]]);
        }
        $driver = config('scout.driver');
        if (! in_array($driver, ['elasticsearch', 'meilisearch'], true)) {
            return response()->json(['message' => 'Tìm kiếm thông minh chưa được bật trên máy chủ.'], 503);
        }

        try {
            if ($driver === 'elasticsearch') {
                $timestamp = now()->timestamp;
                $search = Property::search($text, function ($client, string $query, array $options) use ($timestamp) {
                    $params = [
                        'index' => (new Property)->searchableAs(),
                        'body' => [
                            'query' => [
                                'bool' => [
                                    'must' => [
                                        [
                                            'multi_match' => [
                                                'query' => $query,
                                                'fields' => [
                                                    'title^3', 'code^3', 'project^2', 'address', 'street',
                                                    'district', 'city', 'developer', 'type',
                                                ],
                                                'fuzziness' => 'AUTO',
                                            ],
                                        ],
                                    ],
                                    'filter' => [
                                        ['term' => ['status' => 1]],
                                        [
                                            'bool' => [
                                                'should' => [
                                                    ['term' => ['expires_at' => 0]],
                                                    ['range' => ['expires_at' => ['gte' => $timestamp]]],
                                                ],
                                                'minimum_should_match' => 1,
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ];

                    if (isset($options['size'])) {
                        $params['size'] = $options['size'];
                    }
                    if (isset($options['from'])) {
                        $params['from'] = $options['from'];
                    }
                    if (isset($options['_source'])) {
                        $params['_source'] = $options['_source'];
                    }

                    return $client->search($params);
                })
                    // Always recheck SQL: an old index must never expose hidden/expired/deleted listings.
                    ->query(fn (Builder $query) => $query->publiclyVisible());

                if ($request->boolean('catalog')) {
                    $limit = (int) config('scout.elasticsearch.index-settings.'.Property::class.'.pagination.maxTotalHits', 1000);
                    $matches = $search->options(['_source' => ['id']])->take($limit)->get();

                    return response()->json([
                        'data' => $matches->modelKeys(),
                        'meta' => ['query' => $text, 'total' => $matches->count(), 'limit' => $limit],
                    ])->header('Cache-Control', 'no-store');
                }

                $results = $search->paginate($perPage, 'page', $page);
            } else {
                $search = Property::search($text, function (Indexes $index, string $query, array $options) {
                    $timestamp = now()->timestamp;
                    $options['filter'] = "status = 1 AND (expires_at = 0 OR expires_at >= $timestamp)";

                    return $index->search($query, $options);
                })
                    // Always recheck SQL: an old index must never expose hidden/expired/deleted listings.
                    ->query(fn (Builder $query) => $query->publiclyVisible());

                if ($request->boolean('catalog')) {
                    // The catalog already holds public listing data; return all ranked IDs in one request.
                    $limit = (int) config('scout.meilisearch.index-settings.'.Property::class.'.pagination.maxTotalHits', 1000);
                    $matches = $search->options(['attributesToRetrieve' => ['id']])->take($limit)->get();

                    return response()->json([
                        'data' => $matches->modelKeys(),
                        'meta' => ['query' => $text, 'total' => $matches->count(), 'limit' => $limit],
                    ])->header('Cache-Control', 'no-store');
                }

                $results = $search->paginate($perPage, 'page', $page);
            }
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'Dịch vụ tìm kiếm đang tạm gián đoạn. Vui lòng thử lại sau.'], 503);
        }

        return response()->json([
            'data' => $results->getCollection()->map(function (Property $property) {
                // Only public listing fields leave this endpoint; index metadata is never returned.
                $data = $property->only([
                    'id', 'code', 'title', 'description', 'project', 'address', 'street', 'district', 'city',
                    'developer', 'type', 'purpose', 'area', 'bedrooms', 'bathrooms', 'floors', 'image',
                    'direction', 'legal', 'legal_status', 'furniture', 'lat', 'lng', 'created_at', 'status',
                ]);
                $price = (float) ($property->price ?? ($property->purpose === 'rent' ? $property->price_rent : $property->price_sale));
                $data['price'] = $price;
                $data['price_text'] = \App\Support\PropertyPrice::format($price, $property->purpose === 'rent');
                $field = $property->purpose === 'rent' ? 'price_rent' : 'price_sale';
                $data[$field] = $price;
                $data[$field.'_text'] = $data['price_text'];

                return $data;
            })->values(),
            'meta' => [
                'query' => $text,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ])->header('Cache-Control', 'no-store');
    }
}
