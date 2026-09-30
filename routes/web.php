<?php

use Illuminate\Support\Facades\Route;

use App\Models\Property;


Route::get('/', function () {
    return view('welcome');
});


Route::get('/api/properties', function () {
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable('properties')) {
            $props = Property::all();
            if ($props->isNotEmpty()) {
                return response()->json($props);
            }
        }
    } catch (\Throwable $e) {
        // Fallback to JSON file if database is not migrated yet
    }

    $jsonPath = database_path('data/all_properties.json');
    if (!file_exists($jsonPath)) {
        $jsonPath = database_path('data/vinhomes_properties.json');
    }
    if (file_exists($jsonPath)) {
        return response()->json(json_decode(file_get_contents($jsonPath), true));
    }
    return response()->json([]);
});

Route::get('/api/run-migrate', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();
        
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'PropertySeeder', '--force' => true]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();
        
        $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
        $count = \App\Models\Property::count();

        return response()->json([
            'status' => 'success',
            'migrate' => trim($migrateOutput),
            'seed' => trim($seedOutput),
            'property_count' => $count,
            'tables' => $tables
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

