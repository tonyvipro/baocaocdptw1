<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return response()->json([
        'name' => '3TV Land API - Hệ Thống Quản Lý Bất Động Sản',
        'version' => '1.0.0',
        'status' => 'online',
        'endpoints' => [
            'POST /api/register' => 'Đăng ký tài khoản',
            'POST /api/login' => 'Đăng nhập hệ thống',
            'POST /api/logout' => 'Đăng xuất',
            'GET /api/me' => 'Thông tin tài khoản hiện tại',
            'POST /api/profile' => 'Cập nhật hồ sơ',
            'POST /api/change-password' => 'Đổi mật khẩu',
            'GET /api/properties' => 'Danh sách bất động sản',
            'GET /api/run-migrate' => 'Chạy migration & Seed dữ liệu mẫu'
        ]
    ]);
});

// Authentication Routes (Spec Nhóm 1 - Tài Khoản)
Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);
Route::get('/api/me', [AuthController::class, 'me']);
Route::post('/api/profile', [AuthController::class, 'updateProfile']);
Route::post('/api/change-password', [AuthController::class, 'changePassword']);

// Properties API (Spec Nhóm 2 & Nhóm 4)
Route::get('/api/properties', function () {
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable('properties')) {
            $props = Property::all();
            if ($props->isNotEmpty()) {
                return response()->json($props);
            }
        }
    } catch (\Throwable $e) {
        // Fallback
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

// Migration & Database Seed Trigger
Route::get('/api/run-migrate', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();
        
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();
        
        $propCount = \App\Models\Property::count();
        $userCount = \App\Models\User::count();
        $roleCount = \App\Models\Role::count();

        return response()->json([
            'status' => 'success',
            'message' => 'Cơ sở dữ liệu đã được khởi tạo và nạp dữ liệu mẫu thành công!',
            'migrate' => trim($migrateOutput),
            'seed' => trim($seedOutput),
            'stats' => [
                'properties' => $propCount,
                'users' => $userCount,
                'roles' => $roleCount,
            ]
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});
