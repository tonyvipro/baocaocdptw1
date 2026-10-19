<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyManagementController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\CustomerController;

// CRM: each endpoint verifies the real session/token and the assigned broker.
Route::prefix('/api/customers')->group(function () {
    Route::get('/options', [CustomerController::class, 'options']);
    Route::get('/', [CustomerController::class, 'index']);
    Route::post('/', [CustomerController::class, 'store']);
    Route::get('/{id}', [CustomerController::class, 'show'])->whereNumber('id');
    Route::put('/{id}', [CustomerController::class, 'update'])->whereNumber('id');
    Route::delete('/{id}', [CustomerController::class, 'destroy'])->whereNumber('id');
    Route::delete('/{id}/tracking', [CustomerController::class, 'removeTracking'])->whereNumber('id');
    Route::post('/{id}/interactions', [CustomerController::class, 'addInteraction'])->whereNumber('id');
    Route::post('/{id}/activities', [CustomerController::class, 'addActivity'])->whereNumber('id');
    Route::patch('/{id}/activities/{activityId}', [CustomerController::class, 'updateActivity'])->whereNumber(['id', 'activityId']);
    Route::patch('/{id}/activities/{activityId}/cancel', [CustomerController::class, 'cancelActivity'])->whereNumber(['id', 'activityId']);
    Route::patch('/{id}/activities/{activityId}/complete', [CustomerController::class, 'completeActivity'])->whereNumber(['id', 'activityId']);
});

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

// Appointments & Contracts API (Tự động nhận diện token Sanctum hoặc phiên đăng nhập Admin)
Route::get('/api/appointments', [AppointmentController::class, 'index']);
Route::post('/api/appointments', [AppointmentController::class, 'store']);
Route::patch('/api/appointments/{id}/confirm', [AppointmentController::class, 'confirm']);
Route::patch('/api/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
Route::patch('/api/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule']);

// Contracts API (Spec Hình 38, 39, 40)
Route::get('/api/contracts', [\App\Http\Controllers\ContractController::class, 'index']);
Route::post('/api/contracts', [\App\Http\Controllers\ContractController::class, 'store']);
Route::get('/api/contracts/{id}', [\App\Http\Controllers\ContractController::class, 'show']);
Route::put('/api/contracts/{id}', [\App\Http\Controllers\ContractController::class, 'update']);
Route::patch('/api/contracts/{id}/status', [\App\Http\Controllers\ContractController::class, 'updateStatus']);
Route::delete('/api/contracts/{id}', [\App\Http\Controllers\ContractController::class, 'destroy']);

// View History API (Chức năng Lịch sử xem BĐS)
Route::get('/api/history', function (\Illuminate\Http\Request $request) {
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            $visible = Property::where('status', 1)->where(fn ($q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()))->select('id');
            $logs = \Illuminate\Support\Facades\DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'VIEW')
                ->whereIn('record_id', $visible)
                ->orderBy('created_at', 'desc')
                ->get()
                ->unique('record_id')->take(30)->values()
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
    $request->validate(['property' => 'required|array', 'property.code' => 'required|string|max:50']);
    $property = Property::where('code', $request->input('property.code'))->where('status', 1)->firstOrFail();
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        $prop = $property->toArray();
        $propId = $property->id;

        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            \Illuminate\Support\Facades\DB::table('activity_logs')->updateOrInsert([
                'user_id' => $userId,
                'action' => 'VIEW',
                'table_name' => 'properties',
                'record_id' => $propId ?: 0,
            ], [
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
    $request->validate(['code' => 'nullable|string|max:50']);
    try {
        $userId = \Illuminate\Support\Facades\Auth::id();
        $code = $request->input('code');

        if ($userId && \Illuminate\Support\Facades\Schema::hasTable('activity_logs')) {
            $query = \Illuminate\Support\Facades\DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'VIEW');

            if ($code) {
                $query->where('new_data->code', $code)->delete();
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
Route::get('/api/property-types', [\App\Http\Controllers\PropertyTypeController::class, 'index']);
Route::post('/api/property-types', [\App\Http\Controllers\PropertyTypeController::class, 'save']);
Route::put('/api/property-types/{id}', [\App\Http\Controllers\PropertyTypeController::class, 'save'])->whereNumber('id');
Route::delete('/api/property-types/{id}', [\App\Http\Controllers\PropertyTypeController::class, 'destroy'])->whereNumber('id');
Route::get('/api/properties/stats', [\App\Http\Controllers\PropertyReadController::class, 'stats']);
Route::get('/api/properties/trash', [PropertyManagementController::class, 'trash']);
Route::post('/api/properties/bulk-action', [PropertyManagementController::class, 'bulk']);
Route::post('/api/properties', [PropertyManagementController::class, 'store']);
Route::put('/api/properties/{id}', [PropertyManagementController::class, 'update'])->whereNumber('id');
Route::delete('/api/properties/{id}', [PropertyManagementController::class, 'action'])->whereNumber('id')->defaults('action', 'delete');
Route::patch('/api/properties/{id}/restore', [PropertyManagementController::class, 'action'])->whereNumber('id')->defaults('action', 'restore');
Route::delete('/api/properties/{id}/force', [PropertyManagementController::class, 'action'])->whereNumber('id')->defaults('action', 'force_delete');
Route::patch('/api/properties/{id}/status', [PropertyManagementController::class, 'action'])->whereNumber('id')->defaults('action', 'status');
Route::post('/api/properties/{id}/extend', [PropertyManagementController::class, 'action'])->whereNumber('id')->defaults('action', 'extend');
Route::get('/api/properties/{id}/status-history', [PropertyManagementController::class, 'history'])->whereNumber('id')->defaults('action', 'status');
Route::get('/api/properties/{id}/extension-history', [PropertyManagementController::class, 'history'])->whereNumber('id')->defaults('action', 'extend');

Route::get('/api/properties', function (\Illuminate\Http\Request $request) {
    // The deployed administration UI expects a paginated data/meta envelope.
    // Keep the public listing's array response compatible with the source UI.
    if ($request->boolean('admin')) {
        return app(\App\Http\Controllers\PropertyReadController::class)->index($request);
    }
    return app(\App\Http\Controllers\PropertyReadController::class)->publicIndex($request);
});

// Migration & Database Seed Trigger
Route::get('/api/run-migrate', function (\Illuminate\Http\Request $request) {
    abort_unless($request->user() && $request->user()->is_active, 401, 'Vui lòng đăng nhập lại.');
    abort_unless((int) $request->user()->role_id === 1, 403, 'Chỉ quản trị viên được cập nhật cấu trúc dữ liệu.');
    try {
        $exitCode = \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();
        if ($exitCode !== 0) throw new \RuntimeException('Không cập nhật được cấu trúc dữ liệu.');

        $seedOutput = 'Giữ nguyên dữ liệu hiện có.';

        $propCount = \App\Models\Property::count();
        $userCount = \App\Models\User::count();
        $roleCount = \App\Models\Role::count();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã cập nhật cấu trúc dữ liệu, giữ nguyên tin đăng và tài khoản hiện có.',
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

// User Management & Role Assignment API (Chuẩn Hình 11)
Route::get('/api/users', [\App\Http\Controllers\UserController::class, 'index']);
Route::get('/api/roles', [\App\Http\Controllers\UserController::class, 'getRoles']);
Route::put('/api/users/{id}/assign-role', [\App\Http\Controllers\UserController::class, 'assignRole']);
Route::get('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'show']);
Route::post('/api/users', [\App\Http\Controllers\UserController::class, 'store']);
Route::put('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
Route::delete('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);

Route::get('/api/reports/statistics', [App\Http\Controllers\ReportController::class, 'getStatistics']);
Route::get('/api/dashboard/overview', [\App\Http\Controllers\DashboardController::class, 'getOverview']);

// Category Management API (Hình 50)
Route::get('/api/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show']);
Route::post('/api/categories', [\App\Http\Controllers\CategoryController::class, 'store']);
Route::put('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);
Route::patch('/api/categories/{id}/status', [\App\Http\Controllers\CategoryController::class, 'toggleStatus']);
Route::delete('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);

// Broker & Assignment Management API (Hình 29 & 30)
Route::get('/api/brokers', [\App\Http\Controllers\BrokerController::class, 'indexBrokers']);
Route::post('/api/brokers', [\App\Http\Controllers\BrokerController::class, 'storeBroker']);
Route::get('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'showBroker']);
Route::put('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'updateBroker']);
Route::delete('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'destroyBroker']);

Route::get('/api/broker-assignments', [\App\Http\Controllers\BrokerController::class, 'indexAssignments']);
Route::post('/api/broker-assignments', [\App\Http\Controllers\BrokerController::class, 'storeAssignment']);
Route::get('/api/broker-assignments/{id}', [\App\Http\Controllers\BrokerController::class, 'showAssignment']);
Route::put('/api/broker-assignments/{id}', [\App\Http\Controllers\BrokerController::class, 'updateAssignment']);
Route::patch('/api/broker-assignments/{id}/cancel', [\App\Http\Controllers\BrokerController::class, 'cancelAssignment']);
Route::delete('/api/broker-assignments/{id}', [\App\Http\Controllers\BrokerController::class, 'destroyAssignment']);

Route::get('/api/test-db', function() { return response()->json(['db' => DB::connection()->getDatabaseName(), 'cwd' => getcwd()]); });
