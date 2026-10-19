<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (!isset($argv[1]) || !ctype_digit($argv[1])) throw new InvalidArgumentException('Property id is required.');
$property = App\Models\Property::findOrFail((int) $argv[1]);
echo json_encode(['database' => Illuminate\Support\Facades\DB::connection()->getDatabaseName(), 'id' => $property->id, 'code' => $property->code, 'title' => $property->title, 'property_type_id' => $property->property_type_id], JSON_THROW_ON_ERROR);
