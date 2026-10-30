<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\Gate;
use App\Models\Invoice;
use App\Policies\InvoicePolicy;

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
    }
}
