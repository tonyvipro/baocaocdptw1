<?php

namespace Tests\Feature;

use App\Models\Property;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminPropertyListingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            foreach (['code', 'title', 'address', 'street', 'project', 'type', 'purpose', 'city'] as $field) {
                $table->string($field)->nullable();
            }
            $table->integer('status')->default(1);
            $table->decimal('price', 15, 2)->default(0);
            $table->float('area')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
        Property::create(['code' => 'SALE-1', 'title' => 'Apartment', 'purpose' => 'sale', 'price' => 2000000000, 'status' => 1]);
        Property::create(['code' => 'RENT-1', 'title' => 'House', 'purpose' => 'rent', 'price' => 12000000, 'status' => 0]);
        $deleted = Property::create(['code' => 'DELETED', 'title' => 'Deleted']);
        $deleted->delete();
    }

    public function test_admin_gets_rows_and_pagination_instead_of_an_empty_table(): void
    {
        $this->getJson('/api/properties?admin=1&exclude_pending=1&per_page=12')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'SALE-1')
            ->assertJsonPath('meta.total', 1)->assertJsonPath('meta.current_page', 1);
    }

    public function test_filters_and_empty_results_are_real_database_results(): void
    {
        $this->getJson('/api/properties?admin=1&status=0&purpose=rent')
            ->assertOk()->assertJsonPath('data.0.code', 'RENT-1');
        $this->getJson('/api/properties?admin=1&search=missing')
            ->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }

    public function test_statistics_and_public_array_remain_compatible(): void
    {
        $this->getJson('/api/properties/stats')->assertOk()
            ->assertJsonPath('total', 2)->assertJsonPath('active', 1)
            ->assertJsonPath('pending', 1)->assertJsonPath('trash', 1);
        $this->getJson('/api/properties')->assertOk()->assertJsonPath('0.code', 'SALE-1');
    }

    public function test_search_handles_vietnamese_tokens_across_fields_and_visibility(): void
    {
        Property::where('code', 'SALE-1')->update(['title' => 'Biệt thự Thảo Điền', 'address' => 'Nguyễn Văn Hưởng']);
        foreach (['THAO dien', '  nguyen   biet  ', 'SALE-1'] as $keyword) {
            $url = '/api/properties?'.http_build_query(['search' => $keyword]);
            $this->getJson($url)->assertOk()->assertJsonCount(1)->assertJsonPath('0.code', 'SALE-1');
            $this->getJson($url.'&admin=1')->assertOk()->assertJsonPath('meta.total', 1);
        }
        $this->getJson('/api/properties?search=House')->assertOk()->assertJsonCount(0);
        foreach (['%', '_', "' OR 1=1 --"] as $keyword) {
            $this->getJson('/api/properties?'.http_build_query(['search' => $keyword]))
                ->assertOk()->assertJsonCount(0);
        }
        $this->getJson('/api/properties?search[]=invalid')->assertUnprocessable();
        $this->getJson('/api/properties?search='.str_repeat('a', 251))->assertUnprocessable();
    }

    public function test_api_diagnostics_include_errors_and_hide_timing_in_production(): void
    {
        $this->getJson('/api/properties')->assertOk()->assertHeader('X-Request-ID');
        $this->getJson('/api/properties?search[]=invalid')->assertUnprocessable()->assertHeader('X-Request-ID');
        config(['app.debug' => false]);
        $this->getJson('/api/properties')->assertHeaderMissing('Server-Timing');
    }
}
