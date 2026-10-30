<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(\Meilisearch\Client::class);
$indexName = (new \App\Models\Property)->searchableAs();
$index = $client->index($indexName);
$tasks = $index->getTasks((new \Meilisearch\Contracts\TasksQuery)->setLimit(5))->getResults();
echo json_encode([
    'driver' => config('scout.driver'),
    'database' => \Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
    'health' => $client->health(),
    'index' => $indexName,
    'stats' => $index->stats(),
    'recent_tasks' => array_map(fn (array $task) => [
        'uid' => $task['uid'], 'type' => $task['type'], 'status' => $task['status'],
        'error_code' => $task['error']['code'] ?? null,
    ], $tasks),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
