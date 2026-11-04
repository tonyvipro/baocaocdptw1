<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Invoice;
use App\Policies\InvoicePolicy;
use App\Search\ElasticsearchEngine;
use Elastic\Elasticsearch\ClientBuilder;
use Laravel\Scout\EngineManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Invoice::class, InvoicePolicy::class);
        foreach ([\App\Models\User::class, \App\Models\Category::class, \App\Models\Broker::class,
            \App\Models\BrokerAssignment::class, \App\Models\Customer::class, \App\Models\CustomerDemand::class,
            \App\Models\PropertyType::class, \App\Models\CustomerActivity::class, \App\Models\CustomerInteraction::class] as $model) {
            $model::observe(\App\Observers\ManagementAuditObserver::class);
        }

        // Register custom Elasticsearch engine for Laravel Scout
        if (class_exists(EngineManager::class)) {
            resolve(EngineManager::class)->extend('elasticsearch', function () {
                $hosts = config('scout.elasticsearch.hosts', ['http://127.0.0.1:9200']);
                $client = ClientBuilder::create()->setHosts($hosts)->build();

                return new ElasticsearchEngine(
                    $client,
                    (bool) config('scout.soft_delete', false),
                    (array) config('scout.elasticsearch', [])
                );
            });
        }
    }
}
