<?php

// Read-only checks against the configured database. Never migrate, seed or update.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$query = DB::table('properties');
$active = fn () => DB::table('properties')->whereNull('deleted_at');
$result = [
    'database' => DB::connection()->getDatabaseName(),
    'total_with_trash' => (clone $query)->count(),
    'public_count' => $active()->where('status', 1)->where(fn ($q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()))->count(),
    'blank_titles' => $active()->whereRaw("TRIM(title) = ''")->count(),
    'missing_codes' => $active()->where(fn ($q) => $q->whereNull('code')->orWhere('code', ''))->count(),
    'invalid_status' => $active()->whereNotIn('status', [0, 1, 2, 3, 4])->count(),
    'invalid_area' => $active()->where(fn ($q) => $q->where('area', '<=', 0)->orWhereNull('area'))->count(),
    'invalid_price' => $active()->where('price', '<', 0)->count(),
    'invalid_coordinates' => $active()->where(fn ($q) => $q->whereRaw('ABS(lat) > 90')->orWhereRaw('ABS(lng) > 180'))->count(),
    'missing_coordinates' => $active()->where(fn ($q) => $q->whereNull('lat')->orWhereNull('lng'))->count(),
    'expired_but_status_1' => $active()->where('status', 1)->where('expire_date', '<', now())->count(),
    'stale_price_aliases' => $active()->where(fn ($q) => $q->where(fn ($s) => $s->where('purpose', 'sale')->whereColumn('price_sale', '!=', 'price'))
        ->orWhere(fn ($s) => $s->where('purpose', 'rent')->whereColumn('price_rent', '!=', 'price')))->count(),
    'stale_type_names' => DB::table('properties as p')->join('property_types as t', 'p.property_type_id', '=', 't.id')->whereNull('p.deleted_at')->whereColumn('p.type', '!=', 't.name')->count(),
];
$result['pending_migrations'] = array_values(array_diff(
    array_map(fn ($file) => basename($file, '.php'), glob(__DIR__.'/../database/migrations/*.php')),
    DB::table('migrations')->pluck('migration')->all()
));
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
