<?php

// Read-only deployment probe: no login, tokens, seed data or writes.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (!Illuminate\Support\Facades\Schema::hasColumns('customer_demands', ['customer_id', 'property_type_id', 'budget_min', 'budget_max', 'area', 'status', 'notes', 'version', 'deleted_at'])) {
    throw new RuntimeException('Run the customer_demands migration first.');
}
if (!Illuminate\Support\Facades\Schema::hasColumns('property_types', ['id', 'name', 'status'])) {
    throw new RuntimeException('Run the extend_property_types_table migration first.');
}
$manager = App\Models\User::where('is_active', true)->whereIn('role_id', [1, 2])->orderBy('role_id')->first();
if (!$manager) throw new RuntimeException('An active Admin or Broker account is required to probe manager queries.');

$request = Illuminate\Http\Request::create('/api/demands', 'GET', ['page' => 1]);
$request->setUserResolver(fn () => $manager);
$controller = $app->make(App\Http\Controllers\CustomerDemandController::class);
$list = $controller->index($request);
$options = $controller->options($request);
if ($list->getStatusCode() !== 200 || $options->getStatusCode() !== 200) throw new RuntimeException('Demand API probe failed.');
$listData = json_decode($list->getContent(), true, 512, JSON_THROW_ON_ERROR);
$optionsData = json_decode($options->getContent(), true, 512, JSON_THROW_ON_ERROR);
echo json_encode(['driver' => Illuminate\Support\Facades\DB::connection()->getDriverName(),
    'list_status' => $list->getStatusCode(), 'options_status' => $options->getStatusCode(),
    'visible_demand_count' => $listData['meta']['total'], 'property_type_count' => count($optionsData['property_types'])],
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
