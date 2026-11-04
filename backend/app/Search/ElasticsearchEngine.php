<?php

namespace App\Search;

use Elastic\Elasticsearch\Client;
use Elastic\Elasticsearch\ClientInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\LazyCollection;
use Laravel\Scout\Builder;
use Laravel\Scout\Engines\Engine;

class ElasticsearchEngine extends Engine
{
    protected ClientInterface|Client $client;
    protected bool $softDelete;
    protected array $config;

    public function __construct(ClientInterface|Client $client, bool $softDelete = false, array $config = [])
    {
        $this->client = $client;
        $this->softDelete = $softDelete;
        $this->config = $config;
    }

    public function update($models): void
    {
        if ($models->isEmpty()) {
            return;
        }

        $params = ['body' => []];

        foreach ($models as $model) {
            $searchableData = $model->toSearchableArray();
            if (empty($searchableData)) {
                continue;
            }

            $params['body'][] = [
                'index' => [
                    '_index' => $model->searchableAs(),
                    '_id' => (string) $model->getScoutKey(),
                ],
            ];

            $params['body'][] = array_merge(
                $searchableData,
                $model->scoutMetadata(),
                [$model->getScoutKeyName() => $model->getScoutKey()]
            );
        }

        if (! empty($params['body'])) {
            $this->client->bulk($params);
        }
    }

    public function delete($models): void
    {
        if ($models->isEmpty()) {
            return;
        }

        $params = ['body' => []];

        foreach ($models as $model) {
            $params['body'][] = [
                'delete' => [
                    '_index' => $model->searchableAs(),
                    '_id' => (string) $model->getScoutKey(),
                ],
            ];
        }

        if (! empty($params['body'])) {
            $this->client->bulk($params);
        }
    }

    public function search(Builder $builder): mixed
    {
        return $this->performSearch($builder, array_filter([
            'size' => $builder->limit,
        ]));
    }

    public function paginate(Builder $builder, $perPage, $page): mixed
    {
        return $this->performSearch($builder, [
            'from' => max(0, ($page - 1) * (int) $perPage),
            'size' => (int) $perPage,
        ]);
    }

    protected function performSearch(Builder $builder, array $options = []): mixed
    {
        $options = array_merge($builder->options, $options);

        if ($builder->callback) {
            return call_user_func($builder->callback, $this->client, $builder->query, $options);
        }

        $index = $builder->index ?: $builder->model->searchableAs();
        $params = [
            'index' => $index,
            'body' => [
                'query' => $this->buildQuery($builder),
            ],
        ];

        if (isset($options['from'])) {
            $params['from'] = $options['from'];
        }
        if (isset($options['size'])) {
            $params['size'] = $options['size'];
        }
        if (! empty($options['_source'])) {
            $params['_source'] = $options['_source'];
        }

        if (! empty($builder->orders)) {
            $params['body']['sort'] = collect($builder->orders)->map(function ($order) {
                return [$order['column'] => ['order' => $order['direction']]];
            })->values()->all();
        }

        return $this->client->search($params);
    }

    protected function buildQuery(Builder $builder): array
    {
        $query = trim($builder->query ?? '');
        $must = [];
        $filter = [];

        if ($query !== '' && $query !== '*') {
            $must[] = [
                'multi_match' => [
                    'query' => $query,
                    'fields' => [
                        'title^3', 'code^3', 'project^2', 'address', 'street',
                        'district', 'city', 'developer', 'type',
                    ],
                    'fuzziness' => 'AUTO',
                ],
            ];
        } else {
            $must[] = ['match_all' => new \stdClass()];
        }

        foreach ($builder->wheres as $field => $value) {
            $filter[] = ['term' => [$field => $value]];
        }

        return [
            'bool' => array_filter([
                'must' => $must,
                'filter' => $filter,
            ]),
        ];
    }

    public function mapIds($results): \Illuminate\Support\Collection
    {
        $hits = $this->extractHits($results);

        return collect($hits)->pluck('_id')->values();
    }

    public function map(Builder $builder, $results, $model): Collection
    {
        $count = $this->getTotalCount($results);
        if ($count === 0) {
            return $model->newCollection();
        }

        $hits = $this->extractHits($results);
        $objectIds = collect($hits)->pluck('_id')->values()->all();
        $objectIdPositions = array_flip($objectIds);

        return $model->getScoutModelsByIds($builder, $objectIds)
            ->filter(fn ($m) => isset($objectIdPositions[$m->getScoutKey()]))
            ->sortBy(fn ($m) => $objectIdPositions[$m->getScoutKey()])
            ->values();
    }

    public function lazyMap(Builder $builder, $results, $model): LazyCollection
    {
        $count = $this->getTotalCount($results);
        if ($count === 0) {
            return LazyCollection::empty();
        }

        $hits = $this->extractHits($results);
        $objectIds = collect($hits)->pluck('_id')->values()->all();
        $objectIdPositions = array_flip($objectIds);

        return $model->queryScoutModelsByIds($builder, $objectIds)
            ->cursor()
            ->filter(fn ($m) => isset($objectIdPositions[$m->getScoutKey()]))
            ->sortBy(fn ($m) => $objectIdPositions[$m->getScoutKey()])
            ->values();
    }

    public function getTotalCount($results): int
    {
        if (is_array($results)) {
            return (int) ($results['hits']['total']['value'] ?? $results['hits']['total'] ?? 0);
        }
        if (isset($results['hits']['total']['value'])) {
            return (int) $results['hits']['total']['value'];
        }
        if (isset($results->hits->total->value)) {
            return (int) $results->hits->total->value;
        }

        return 0;
    }

    public function flush($model): void
    {
        try {
            $this->client->deleteByQuery([
                'index' => $model->searchableAs(),
                'body' => ['query' => ['match_all' => new \stdClass()]],
            ]);
        } catch (\Throwable) {
            // Silence if index does not exist yet.
        }
    }

    public function createIndex($name, array $options = []): mixed
    {
        return $this->client->indices()->create([
            'index' => $name,
            'body' => $options,
        ]);
    }

    public function deleteIndex($name): mixed
    {
        return $this->client->indices()->delete([
            'index' => $name,
        ]);
    }

    public function getClient(): ClientInterface|Client
    {
        return $this->client;
    }

    protected function extractHits(mixed $results): array
    {
        if (is_array($results)) {
            return $results['hits']['hits'] ?? [];
        }
        if (isset($results['hits']['hits'])) {
            return (array) $results['hits']['hits'];
        }
        if (isset($results->hits->hits)) {
            return (array) $results->hits->hits;
        }

        return [];
    }
}
