<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AppointmentController;

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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/api/appointments', [AppointmentController::class, 'index']);
    Route::post('/api/appointments', [AppointmentController::class, 'store']);
    Route::patch('/api/appointments/{id}/confirm', [AppointmentController::class, 'confirm']);
    Route::patch('/api/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::patch('/api/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    
    // Contracts API
    Route::get('/api/contracts', [\App\Http\Controllers\ContractController::class, 'index']);
    Route::post('/api/contracts', [\App\Http\Controllers\ContractController::class, 'store']);
});

// View History API (Chức năng Lịch sử xem BĐS)
Route::get('/api/history', function (\Illuminate\Http\Request $request) {
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            $logs = \Illuminate\Support\Facades\DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'VIEW')
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get()
                ->map(function ($item) {
                    $item->property_data = json_decode($item->new_data, true);
                    return $item;
                });
            return response()->json($logs);
        }
    } catch (\Throwable $e) {}
    return response()->json([]);
});

Route::post('/api/history', function (\Illuminate\Http\Request $request) {
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        $prop = $request->input('property', []);
        $propId = $prop['id'] ?? $request->input('property_id', 0);
        
        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            \Illuminate\Support\Facades\DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => 'VIEW',
                'table_name' => 'properties',
                'record_id' => $propId ?: 0,
                'new_data' => json_encode($prop),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        return response()->json(['status' => 'success']);
    } catch (\Throwable $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
});

Route::delete('/api/history', function (\Illuminate\Http\Request $request) {
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        $code = $request->input('code');

        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            $query = \Illuminate\Support\Facades\DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'VIEW');

            if ($code) {
                $query->where('new_data', 'like', '%"code":"' . $code . '"%')->delete();
            } else {
                $query->delete();
            }
        }
        return response()->json(['status' => 'success']);
    } catch (\Throwable $e) {
        return response()->json(['status' => 'error'], 500);
    }
});

// Properties API (Spec Nhóm 2 & Nhóm 4) - Lấy dữ liệu trực tiếp từ Database MySQL
Route::get('/api/properties', function () {
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable('properties')) {
            $props = Property::orderBy('id', 'asc')->get();
            if ($props->isNotEmpty()) {
                $props->transform(function ($item) {
                    if (empty($item->price_sale_text) && !empty($item->price_sale)) {
                        $p = (float) $item->price_sale;
                        $item->price_sale_text = $p >= 1000000000 ? round($p / 1000000000, 2) . ' tỷ' : round($p / 1000000, 0) . ' triệu';
                    }
                    if (empty($item->price_rent_text) && !empty($item->price_rent)) {
                        $p = (float) $item->price_rent;
                        $item->price_rent_text = round($p / 1000000, 1) . ' triệu/tháng';
                    }
                    return $item;
                });

                return response()->json($props)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control')
                    ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                    ->header('Pragma', 'no-cache')
                    ->header('Expires', '0');
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
        return response()->json(json_decode(file_get_contents($jsonPath), true))
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
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
