<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyManagementController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CustomerDemandController;

Route::prefix('/api/demands')->group(function () {
    Route::get('/options', [CustomerDemandController::class, 'options']);
    Route::get('/', [CustomerDemandController::class, 'index']);
    Route::post('/', [CustomerDemandController::class, 'store']);
    Route::get('/{id}', [CustomerDemandController::class, 'show'])->whereNumber('id');
    Route::put('/{id}', [CustomerDemandController::class, 'update'])->whereNumber('id');
    Route::delete('/{id}', [CustomerDemandController::class, 'destroy'])->whereNumber('id');
});

Route::get('/api/notifications', [NotificationController::class, 'index']);
Route::get('/api/notifications/unread-count', [NotificationController::class, 'unreadCount']);
Route::patch('/api/notifications/read-all', [NotificationController::class, 'markAllRead']);
Route::get('/api/notifications/logs/download', [NotificationController::class, 'downloadLogs']);

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
Route::post('/api/profile', [AuthController::class, 'updateProfile'])->middleware(\App\Http\Middleware\RequireRecordVersion::class.':users');
Route::post('/api/change-password', [AuthController::class, 'changePassword'])->middleware(\App\Http\Middleware\RequireRecordVersion::class.':users');

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

// Contract Extensions API (Spec Hình 41 - Gia hạn hợp đồng)
Route::get('/api/contracts/{contract}/extensions', [\App\Http\Controllers\ContractExtensionController::class, 'indexByContract']);
Route::get('/api/contracts/{contract}/extension-eligibility', [\App\Http\Controllers\ContractExtensionController::class, 'checkEligibility']);
Route::get('/api/contracts/{contract}/extension-draft', [\App\Http\Controllers\ContractExtensionController::class, 'getDraft']);
Route::post('/api/contracts/{contract}/extensions', [\App\Http\Controllers\ContractExtensionController::class, 'storeDraft']);

Route::get('/api/contract-extensions', [\App\Http\Controllers\ContractExtensionController::class, 'indexAll']);
Route::put('/api/contract-extensions/{extension}', [\App\Http\Controllers\ContractExtensionController::class, 'updateDraft']);
Route::post('/api/contract-extensions/{extension}/submit', [\App\Http\Controllers\ContractExtensionController::class, 'submit']);
Route::post('/api/contract-extensions/{extension}/approve', [\App\Http\Controllers\ContractExtensionController::class, 'approve']);
Route::post('/api/contract-extensions/{extension}/reject', [\App\Http\Controllers\ContractExtensionController::class, 'reject']);
Route::post('/api/contract-extensions/{extension}/cancel', [\App\Http\Controllers\ContractExtensionController::class, 'cancel']);
Route::delete('/api/contract-extensions/{extension}', [\App\Http\Controllers\ContractExtensionController::class, 'destroy']);
Route::post('/api/contract-extensions/{extension}/documents', [\App\Http\Controllers\ContractExtensionController::class, 'uploadDocuments']);
Route::delete('/api/contract-extensions/{extension}/documents/{document}', [\App\Http\Controllers\ContractExtensionController::class, 'destroyDocument']);

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
Route::get('/api/users', [\App\Http\Controllers\UserController::class, 'index'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::get('/api/roles', [\App\Http\Controllers\UserController::class, 'getRoles'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::put('/api/users/{id}/assign-role', [\App\Http\Controllers\UserController::class, 'assignRole'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':users');
Route::get('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'show'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::post('/api/users', [\App\Http\Controllers\UserController::class, 'store'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::put('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'update'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':users');
Route::delete('/api/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':users');

Route::get('/api/reports/statistics', [App\Http\Controllers\ReportController::class, 'getStatistics'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::get('/api/dashboard/overview', [\App\Http\Controllers\DashboardController::class, 'getOverview'])->middleware(\App\Http\Middleware\ManagementAccess::class);

// Category Management API (Hình 50)
Route::get('/api/categories', [\App\Http\Controllers\CategoryController::class, 'index'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::get('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::post('/api/categories', [\App\Http\Controllers\CategoryController::class, 'store'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::put('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':categories');
Route::patch('/api/categories/{id}/status', [\App\Http\Controllers\CategoryController::class, 'toggleStatus'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':categories');
Route::delete('/api/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':categories');

// Broker & Assignment Management API (Hình 29 & 30)
Route::get('/api/brokers', [\App\Http\Controllers\BrokerController::class, 'indexBrokers'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::post('/api/brokers', [\App\Http\Controllers\BrokerController::class, 'storeBroker'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::get('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'showBroker'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::put('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'updateBroker'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':brokers');
Route::delete('/api/brokers/{id}', [\App\Http\Controllers\BrokerController::class, 'destroyBroker'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':brokers');

Route::get('/api/broker-assignments', [\App\Http\Controllers\BrokerController::class, 'indexAssignments'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::post('/api/broker-assignments', [\App\Http\Controllers\BrokerController::class, 'storeAssignment'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::get('/api/broker-assignments/{id}', [\App\Http\Controllers\BrokerController::class, 'showAssignment'])->middleware(\App\Http\Middleware\ManagementAccess::class);
Route::put('/api/broker-assignments/{id}', [\App\Http\Controllers\BrokerController::class, 'updateAssignment'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':broker_assignments');
Route::patch('/api/broker-assignments/{id}/cancel', [\App\Http\Controllers\BrokerController::class, 'cancelAssignment'])->middleware(\App\Http\Middleware\ManagementAccess::class)->middleware(\App\Http\Middleware\RequireRecordVersion::class.':broker_assignments');
Route::get('/api/contract-documents', [\App\Http\Controllers\ContractDocumentController::class, 'index']);
Route::get('/api/contracts/{contract}/documents', [\App\Http\Controllers\ContractDocumentController::class, 'indexByContract']);
Route::post('/api/contracts/{contract}/documents', [\App\Http\Controllers\ContractDocumentController::class, 'store']);
Route::get('/api/contract-documents/{document}', [\App\Http\Controllers\ContractDocumentController::class, 'show']);
Route::get('/api/contract-documents/{document}/preview', [\App\Http\Controllers\ContractDocumentController::class, 'preview']);
Route::get('/api/contract-documents/{document}/download', [\App\Http\Controllers\ContractDocumentController::class, 'download']);
Route::put('/api/contract-documents/{document}', [\App\Http\Controllers\ContractDocumentController::class, 'update']);
Route::delete('/api/contract-documents/{document}', [\App\Http\Controllers\ContractDocumentController::class, 'destroy']);

// Customer Portal Contracts & Documents API (Khách hàng)
Route::get('/api/my/contracts', [\App\Http\Controllers\CustomerContractController::class, 'index']);
Route::get('/api/my/contracts/{contract}', [\App\Http\Controllers\CustomerContractController::class, 'show']);
Route::get('/api/my/contracts/{contract}/documents', [\App\Http\Controllers\CustomerContractController::class, 'documents']);
Route::get('/api/my/contract-documents/{document}/preview', [\App\Http\Controllers\CustomerContractController::class, 'preview']);
Route::get('/api/my/contract-documents/{document}/download', [\App\Http\Controllers\CustomerContractController::class, 'download']);

Route::get('/api/test-db', function() { return response()->json(['db' => DB::connection()->getDatabaseName(), 'cwd' => getcwd()]); });
