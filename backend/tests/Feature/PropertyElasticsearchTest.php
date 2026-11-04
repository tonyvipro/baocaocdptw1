<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Search\ElasticsearchEngine;
use Elastic\Elasticsearch\ClientInterface;
use Elastic\Transport\Exception\NoNodeAvailableException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Scout\EngineManager;
use Mockery;
use Tests\TestCase;

class PropertyElasticsearchTest extends TestCase
{
    use RefreshDatabase;

    private function listing(array $attributes = []): Property
    {
        return Property::create(array_merge([
            'title' => 'Biệt thự Thảo Điền',
            'status' => 1,
            'purpose' => 'sale',
            'price' => 2500000000,
            'area' => 120,
            'city' => 'Hồ Chí Minh',
        ], $attributes));
    }

    private function mockElasticsearch(): Mockery\MockInterface
    {
        config(['scout.driver' => 'elasticsearch']);
        $client = Mockery::mock(ClientInterface::class);

        $engine = new ElasticsearchEngine($client, false, config('scout.elasticsearch', []));

        $manager = $this->app->make(EngineManager::class);
        $manager->extend('elasticsearch', fn () => $engine);
        $manager->forgetDrivers();

        return $client;
    }

    public function test_query_validation_and_empty_search_do_not_contact_the_engine(): void
    {
        $this->getJson('/api/search/properties?q=')->assertOk()->assertJsonCount(0, 'data');
        foreach (['q[]=bad', 'q='.str_repeat('a', 251), 'q=test&page=0', 'q=test&per_page=25'] as $query) {
            $this->getJson('/api/search/properties?'.$query)->assertUnprocessable();
        }
    }

    public function test_driver_check_rejects_unsupported_drivers(): void
    {
        config(['scout.driver' => 'null']);
        $this->getJson('/api/search/properties?q=test')->assertStatus(503)
            ->assertJsonPath('message', 'Tìm kiếm thông minh chưa được bật trên máy chủ.');
    }

    public function test_search_rechecks_sql_visibility_keeps_ranking_and_returns_current_public_data(): void
    {
        $first = $this->listing(['code' => 'FIRST']);
        $hidden = $this->listing(['status' => 4]);
        $expired = $this->listing(['expire_date' => now()->subHour()]);
        $deleted = $this->listing();
        $deleted->delete();
        $second = $this->listing(['code' => 'SECOND', 'title' => 'Tiêu đề từ SQL', 'owner_phone' => '0901234567']);

        $hits = array_map(fn ($id) => ['_id' => (string) $id, '_source' => ['id' => $id, 'title' => 'Old title']], [
            $second->id, $hidden->id, $expired->id, $deleted->id, $first->id,
        ]);

        $client = $this->mockElasticsearch();
        $client->shouldReceive('search')->once()->with(Mockery::on(function (array $params) {
            return $params['index'] === '3tvland_properties'
                && $params['size'] === 8
                && $params['from'] === 0
                && isset($params['body']['query']['bool']['must'][0]['bool']['should'][2]['multi_match']['query'])
                && $params['body']['query']['bool']['must'][0]['bool']['should'][2]['multi_match']['query'] === 'thao dien';
        }))->andReturn([
            'hits' => [
                'total' => ['value' => 5],
                'hits' => $hits,
            ],
        ]);

        $this->getJson('/api/search/properties?q=thao%20dien')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $second->id)->assertJsonPath('data.0.title', 'Tiêu đề từ SQL')
            ->assertJsonPath('data.1.id', $first->id)->assertJsonPath('data.0.price_text', '2.5 tỷ')
            ->assertJsonMissingPath('data.0.owner_phone')->assertJsonMissingPath('data.0._formatted');
    }

    public function test_engine_receives_pagination_and_empty_results_are_successful(): void
    {
        $client = $this->mockElasticsearch();
        $client->shouldReceive('search')->once()
            ->with(Mockery::on(fn ($params) => $params['size'] === 4 && $params['from'] === 4))
            ->andReturn([
                'hits' => [
                    'total' => ['value' => 0],
                    'hits' => [],
                ],
            ]);

        $this->getJson('/api/search/properties?q=missing&page=2&per_page=4')->assertOk()
            ->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0)->assertJsonPath('meta.current_page', 2);
    }

    public function test_catalog_returns_all_ranked_public_ids_for_combined_frontend_filters(): void
    {
        $properties = collect(range(1, 12))->map(fn ($number) => $this->listing(['code' => 'MATCH-'.$number]));
        $hidden = $this->listing(['status' => 4]);
        $deleted = $this->listing();
        $deleted->delete();
        $ids = $properties->reverse()->pluck('id')->values()->all();

        $hits = array_map(fn ($id) => ['_id' => (string) $id, '_source' => ['id' => $id]], [...$ids, $hidden->id, $deleted->id]);

        $client = $this->mockElasticsearch();
        $client->shouldReceive('search')->once()
            ->with(Mockery::on(fn ($params) => $params['size'] === 1000 && in_array('id', $params['_source'] ?? [])))
            ->andReturn([
                'hits' => [
                    'total' => ['value' => count($hits)],
                    'hits' => $hits,
                ],
            ]);

        $this->getJson('/api/search/properties?q=vinhomez&catalog=1')->assertOk()
            ->assertExactJson(['data' => $ids, 'meta' => ['query' => 'vinhomez', 'total' => 12, 'limit' => 1000]]);
    }

    public function test_search_outage_is_a_friendly_503_without_connection_details(): void
    {
        $client = $this->mockElasticsearch();
        $client->shouldReceive('search')->andThrow(new \RuntimeException('Connection refused to http://elasticsearch:9200'));

        $this->getJson('/api/search/properties?q=test')->assertStatus(503)
            ->assertJsonPath('message', 'Dịch vụ tìm kiếm đang tạm gián đoạn. Vui lòng thử lại sau.')
            ->assertDontSee('http://elasticsearch:9200');
    }

    public function test_prefix_and_typo_fuzzy_queries_build_should_clauses(): void
    {
        $messi = $this->listing(['title' => 'Lionel Messi Villa', 'code' => 'MESSI-01']);

        $client = $this->mockElasticsearch();
        $client->shouldReceive('search')->twice()->with(Mockery::on(function (array $params) {
            $should = $params['body']['query']['bool']['must'][0]['bool']['should'] ?? [];
            $hasExact = isset($should[2]['multi_match']['query']);
            $hasPrefix = isset($should[3]['multi_match']['type']) && $should[3]['multi_match']['type'] === 'phrase_prefix';
            $hasFuzzy = isset($should[4]['multi_match']['fuzziness']);
            return $hasExact && $hasPrefix && $hasFuzzy;
        }))->andReturn([
            'hits' => [
                'total' => ['value' => 1],
                'hits' => [['_id' => (string) $messi->id, '_source' => ['id' => $messi->id]]],
            ],
        ]);

        // Test prefix 'mes'
        $this->getJson('/api/search/properties?q=mes')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $messi->id);

        // Test typo/fuzzy 'mei'
        $this->getJson('/api/search/properties?q=mei')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $messi->id);
    }
}
