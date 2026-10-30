<?php

namespace Tests\Feature;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Scout\EngineManager;
use Meilisearch\Client;
use Meilisearch\Endpoints\Indexes;
use Meilisearch\Exceptions\CommunicationException;
use Mockery;
use Tests\TestCase;

class PropertyMeilisearchTest extends TestCase
{
    use RefreshDatabase;

    private function listing(array $attributes = []): Property
    {
        return Property::create(array_merge([
            'title' => 'Biệt thự Thảo Điền', 'status' => 1, 'purpose' => 'sale',
            'price' => 2500000000, 'area' => 120, 'city' => 'Hồ Chí Minh',
        ], $attributes));
    }

    private function mockIndex(): Indexes
    {
        config(['scout.driver' => 'meilisearch']);
        $index = Mockery::mock(Indexes::class);
        $client = Mockery::mock(Client::class);
        $client->shouldReceive('index')->with('3tvland_properties')->andReturn($index);
        $this->app->instance(Client::class, $client);
        $this->app->make(EngineManager::class)->forgetDrivers();

        return $index;
    }

    public function test_query_validation_and_empty_search_do_not_contact_the_engine(): void
    {
        $this->getJson('/api/search/properties?q=')->assertOk()->assertJsonCount(0, 'data');
        foreach (['q[]=bad', 'q='.str_repeat('a', 251), 'q=test&page=0', 'q=test&per_page=25'] as $query) {
            $this->getJson('/api/search/properties?'.$query)->assertUnprocessable();
        }
        $this->getJson('/api/search/properties?q=test')->assertStatus(503);
    }

    public function test_search_rechecks_sql_visibility_keeps_ranking_and_returns_current_public_data(): void
    {
        $first = $this->listing(['code' => 'FIRST']);
        $hidden = $this->listing(['status' => 4]);
        $expired = $this->listing(['expire_date' => now()->subHour()]);
        $deleted = $this->listing();
        $deleted->delete();
        $second = $this->listing(['code' => 'SECOND', 'title' => 'Tiêu đề từ SQL', 'owner_phone' => '0901234567']);
        $hits = array_map(fn ($id) => ['id' => $id, 'title' => 'Old index title'], [$second->id, $hidden->id, $expired->id, $deleted->id, $first->id]);
        $this->mockIndex()->shouldReceive('search')->once()->with('thao dien', Mockery::on(function (array $options) {
            return $options['hitsPerPage'] === 8 && $options['page'] === 1
                && str_contains($options['filter'], 'status = 1') && str_contains($options['filter'], 'expires_at >=');
        }))->andReturn(['hits' => $hits, 'totalHits' => 5]);

        $this->getJson('/api/search/properties?q=thao%20dien')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $second->id)->assertJsonPath('data.0.title', 'Tiêu đề từ SQL')
            ->assertJsonPath('data.1.id', $first->id)->assertJsonPath('data.0.price_text', '2.5 tỷ')
            ->assertJsonMissingPath('data.0.owner_phone')->assertJsonMissingPath('data.0._formatted');
    }

    public function test_engine_receives_pagination_and_empty_results_are_successful(): void
    {
        $this->mockIndex()->shouldReceive('search')->once()
            ->with('missing', Mockery::on(fn ($options) => $options['hitsPerPage'] === 4 && $options['page'] === 2))
            ->andReturn(['hits' => [], 'totalHits' => 0]);

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
        $hits = array_map(fn ($id) => ['id' => $id], [...$ids, $hidden->id, $deleted->id]);
        $this->mockIndex()->shouldReceive('search')->once()
            ->with('vinhomez', Mockery::on(fn ($options) => $options['hitsPerPage'] === 1000 && in_array('id', $options['attributesToRetrieve'])))
            ->andReturn(['hits' => $hits, 'totalHits' => count($hits)]);

        $this->getJson('/api/search/properties?q=vinhomez&catalog=1')->assertOk()
            ->assertExactJson(['data' => $ids, 'meta' => ['query' => 'vinhomez', 'total' => 12, 'limit' => 1000]]);
    }

    public function test_search_outage_is_a_friendly_503_without_connection_details(): void
    {
        $this->mockIndex()->shouldReceive('search')->andThrow(new CommunicationException('private host and secret'));

        $this->getJson('/api/search/properties?q=test')->assertStatus(503)
            ->assertJsonPath('message', 'Dịch vụ tìm kiếm đang tạm gián đoạn. Vui lòng thử lại sau.')
            ->assertDontSee('private host and secret');
    }

    public function test_index_payload_is_typed_and_excludes_private_fields(): void
    {
        $property = $this->listing(['owner_phone' => '0901234567', 'rejection_reason' => 'internal note']);
        $document = $property->toSearchableArray();
        $this->assertIsInt($document['id']);
        $this->assertIsFloat($document['price']);
        $this->assertIsInt($document['expires_at']);
        $this->assertArrayNotHasKey('owner_phone', $document);
        $this->assertArrayNotHasKey('rejection_reason', $document);
        $this->assertTrue($property->shouldBeSearchable());
        $property->status = 4;
        $this->assertFalse($property->shouldBeSearchable());
        $property->status = 1;
        $property->expire_date = now()->subMinute();
        $this->assertFalse($property->shouldBeSearchable());
        $property->expire_date = null;
        $property->deleted_at = now();
        $this->assertFalse($property->shouldBeSearchable());
    }
}
