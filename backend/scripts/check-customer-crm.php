<?php

// Read-only deployment check. Does not create accounts or customer records.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (['customers', 'customer_interactions', 'customer_activities'] as $table) {
    if (!Illuminate\Support\Facades\Schema::hasTable($table)) throw new RuntimeException('Missing CRM table: '.$table);
}
$customer = (new App\Models\Customer)->forceFill(['id' => -1]);
$customer->lastInteraction()->get();
$customer->nextActivity()->get();
$customer->interactions()->with('actor')->paginate(8);
$customer->activities()->where('status', 'pending')->paginate(8);
App\Models\Customer::with(['assignedTo', 'lastInteraction', 'nextActivity'])->limit(10)->get()->toArray();
echo json_encode([
    'database' => Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
    'driver' => Illuminate\Support\Facades\DB::connection()->getDriverName(),
    'tables_and_queries' => 'OK',
    'customer_count' => App\Models\Customer::count(),
    'tracked_count' => App\Models\Customer::where('is_tracked', true)->count(),
    'seeded_count' => App\Models\Customer::whereNotNull('seed_key')->count(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
