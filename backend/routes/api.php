<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContractExtensionController;
use App\Http\Controllers\ContractDocumentController;
use App\Http\Controllers\CustomerContractController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MyInvoiceController;
use App\Http\Controllers\{AuthController, UserController, CategoryController, BrokerController,
    CustomerController, CustomerDemandController, NotificationController, DashboardController, ReportController};
use App\Http\Middleware\{ManagementAccess, RequireRecordVersion};

// Registration also starts a web session for the existing SPA login flow.
Route::post('/register', [\App\Http\Controllers\AuthController::class, 'register'])
    ->middleware('web');
Route::post('/login', [AuthController::class, 'login'])->middleware('web');

Route::get('/search/properties', \App\Http\Controllers\PropertySearchController::class)
    ->middleware('throttle:120,1');
use App\Http\Controllers\Api\RentPaymentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\MetaController;

// Public Metadata API
Route::get('/meta/field-limits', [MetaController::class, 'fieldLimits']);
Route::get('/categories/options', [CategoryController::class, 'options']);

// Giang's protected APIs. Web middleware preserves the existing SPA session/audit flow.
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::middleware(ManagementAccess::class.':account.view')->group(function () {
        Route::get('/user', function (Request $request) {
            $user = $request->user();
            return response()->json([...$user->toArray(), ...$user->accessData()]);
        });
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
    Route::post('/profile', [AuthController::class, 'updateProfile'])
        ->middleware([ManagementAccess::class.':profile.update', RequireRecordVersion::class.':users']);
    Route::post('/change-password', [AuthController::class, 'changePassword'])
        ->middleware([ManagementAccess::class.':password.update', RequireRecordVersion::class.':users']);

    Route::middleware(ManagementAccess::class.':users.manage')->group(function () {
        Route::get('/unit-options', [UserController::class, 'unitOptions']);
        Route::get('/users/unit-options', [UserController::class, 'unitOptions']);
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show'])->whereNumber('id');
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update'])->whereNumber('id')->middleware(RequireRecordVersion::class.':users');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->whereNumber('id')->middleware(RequireRecordVersion::class.':users');
    });
    Route::middleware(ManagementAccess::class.':roles.manage')->group(function () {
        Route::get('/roles', [UserController::class, 'getRoles']);
        Route::put('/users/{id}/assign-role', [UserController::class, 'assignRole'])
            ->whereNumber('id')->middleware(RequireRecordVersion::class.':users');
    });
    Route::get('/dashboard/overview', [DashboardController::class, 'getOverview'])->middleware(ManagementAccess::class.':dashboard.view');
    Route::get('/reports/statistics/pdf', [ReportController::class, 'exportPdf'])->middleware(ManagementAccess::class.':reports.view');
    Route::get('/reports/statistics', [ReportController::class, 'getStatistics'])->middleware(ManagementAccess::class.':reports.view');

    Route::middleware(ManagementAccess::class.':categories.manage')->prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{id}', [CategoryController::class, 'show'])->whereNumber('id');
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{id}', [CategoryController::class, 'update'])->whereNumber('id')->middleware(RequireRecordVersion::class.':categories');
        Route::patch('/{id}/status', [CategoryController::class, 'toggleStatus'])->whereNumber('id')->middleware(RequireRecordVersion::class.':categories');
        Route::delete('/{id}', [CategoryController::class, 'destroy'])->whereNumber('id')->middleware(RequireRecordVersion::class.':categories');
    });
    Route::middleware(ManagementAccess::class.':brokers.manage')->prefix('brokers')->group(function () {
        Route::get('/', [BrokerController::class, 'indexBrokers']);
        Route::post('/', [BrokerController::class, 'storeBroker']);
        Route::get('/{id}', [BrokerController::class, 'showBroker'])->whereNumber('id');
        Route::get('/{id}/active-work', [BrokerController::class, 'checkActiveWork'])->whereNumber('id');
        Route::post('/{id}/link-user', [BrokerController::class, 'linkUser'])->whereNumber('id')->middleware(RequireRecordVersion::class.':brokers');
        Route::post('/{id}/unlink-user', [BrokerController::class, 'unlinkUser'])->whereNumber('id')->middleware(RequireRecordVersion::class.':brokers');
        Route::put('/{id}', [BrokerController::class, 'updateBroker'])->whereNumber('id')->middleware(RequireRecordVersion::class.':brokers');
        Route::delete('/{id}', [BrokerController::class, 'destroyBroker'])->whereNumber('id')->middleware(RequireRecordVersion::class.':brokers');
    });
    Route::middleware(ManagementAccess::class.':assignments.manage')->prefix('broker-assignments')->group(function () {
        Route::get('/', [BrokerController::class, 'indexAssignments']);
        Route::post('/', [BrokerController::class, 'storeAssignment']);
        Route::get('/{id}', [BrokerController::class, 'showAssignment'])->whereNumber('id');
        Route::put('/{id}', [BrokerController::class, 'updateAssignment'])->whereNumber('id')->middleware(RequireRecordVersion::class.':broker_assignments');
        Route::post('/{id}/transfer', [BrokerController::class, 'transferAssignment'])->whereNumber('id')->middleware(RequireRecordVersion::class.':broker_assignments');
        Route::patch('/{id}/cancel', [BrokerController::class, 'cancelAssignment'])->whereNumber('id')->middleware(RequireRecordVersion::class.':broker_assignments');
    });
    Route::middleware(ManagementAccess::class.':customers.manage')->prefix('customers')->group(function () {
        Route::get('/options', [CustomerController::class, 'options']);
        Route::get('/', [CustomerController::class, 'index']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::post('/check-duplicates', [CustomerController::class, 'checkDuplicates']);
        Route::post('/merge', [CustomerController::class, 'merge']);
        Route::post('/{id}/transfer-broker', [CustomerController::class, 'transferPrimaryBroker'])->whereNumber('id');
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
    Route::middleware(ManagementAccess::class.':demands.manage')->prefix('demands')->group(function () {
        Route::get('/options', [CustomerDemandController::class, 'options']);
        Route::get('/', [CustomerDemandController::class, 'index']);
        Route::post('/', [CustomerDemandController::class, 'store']);
        Route::get('/{id}', [CustomerDemandController::class, 'show'])->whereNumber('id');
        Route::get('/{id}/matching-properties', [CustomerDemandController::class, 'matchingProperties'])->whereNumber('id');
        Route::put('/{id}', [CustomerDemandController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [CustomerDemandController::class, 'destroy'])->whereNumber('id');
    });
    Route::middleware(ManagementAccess::class.':notifications.view')->prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/logs', [NotificationController::class, 'activityLogs']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/read-all', [NotificationController::class, 'markAllRead']);
        Route::get('/logs/download', [NotificationController::class, 'downloadLogs']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Contract Extensions API
    Route::get('/contracts/{contract}/extensions', [ContractExtensionController::class, 'indexByContract']);
    Route::get('/contracts/{contract}/extension-eligibility', [ContractExtensionController::class, 'checkEligibility']);
    Route::get('/contracts/{contract}/extension-draft', [ContractExtensionController::class, 'getDraft']);
    Route::post('/contracts/{contract}/extensions', [ContractExtensionController::class, 'storeDraft']);

    Route::get('/contract-extensions', [ContractExtensionController::class, 'indexAll']);
    Route::put('/contract-extensions/{extension}', [ContractExtensionController::class, 'updateDraft']);
    Route::post('/contract-extensions/{extension}/submit', [ContractExtensionController::class, 'submit']);
    Route::post('/contract-extensions/{extension}/approve', [ContractExtensionController::class, 'approve']);
    Route::post('/contract-extensions/{extension}/reject', [ContractExtensionController::class, 'reject']);
    Route::post('/contract-extensions/{extension}/cancel', [ContractExtensionController::class, 'cancel']);
    Route::delete('/contract-extensions/{extension}', [ContractExtensionController::class, 'destroy']);
    Route::post('/contract-extensions/{extension}/documents', [ContractExtensionController::class, 'uploadDocuments']);
    Route::delete('/contract-extensions/{extension}/documents/{document}', [ContractExtensionController::class, 'destroyDocument']);

    // Contract Documents API (Nhân viên: Admin & Broker)
    Route::get('/contract-documents', [ContractDocumentController::class, 'index']);
    Route::get('/contracts/{contract}/documents', [ContractDocumentController::class, 'indexByContract']);
    Route::post('/contracts/{contract}/documents', [ContractDocumentController::class, 'store']);
    Route::get('/contract-documents/{document}', [ContractDocumentController::class, 'show']);
    Route::get('/contract-documents/{document}/preview', [ContractDocumentController::class, 'preview']);
    Route::get('/contract-documents/{document}/download', [ContractDocumentController::class, 'download']);
    Route::put('/contract-documents/{document}', [ContractDocumentController::class, 'update']);
    Route::delete('/contract-documents/{document}', [ContractDocumentController::class, 'destroy']);

    // Customer Portal Contracts & Documents API (Khách hàng)
    Route::get('/my/contracts', [CustomerContractController::class, 'index']);
    Route::get('/my/contracts/{contract}', [CustomerContractController::class, 'show']);
    Route::get('/my/contracts/{contract}/documents', [CustomerContractController::class, 'documents']);
    Route::get('/my/contract-documents/{document}/preview', [CustomerContractController::class, 'preview']);
    Route::get('/my/contract-documents/{document}/download', [CustomerContractController::class, 'download']);

    // Invoices API - Nhân viên (Spec 5.1)
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);
    Route::post('/invoices/{invoice}/send-email', [InvoiceController::class, 'sendEmail']);
    Route::get('/contracts/{contract}/invoices', [InvoiceController::class, 'contractInvoices']);

    // Invoices API - Khách hàng (Spec 5.2)
    Route::get('/my/invoices', [MyInvoiceController::class, 'index']);
    Route::get('/my/invoices/{invoice}', [MyInvoiceController::class, 'show']);
    Route::get('/my/invoices/{invoice}/pdf', [MyInvoiceController::class, 'pdf']);

    // Quản lý Tiền Thuê API (Spec Hình 43 & Mục 5.1)
    Route::get('/rent-payments', [RentPaymentController::class, 'index']);
    Route::get('/rent-payments/summary', [RentPaymentController::class, 'summary']);
    Route::get('/rent-payments/payable', [RentPaymentController::class, 'payable']);
    Route::get('/rent-payments/{id}', [RentPaymentController::class, 'show']);
    Route::post('/invoices/{id}/payments', [RentPaymentController::class, 'recordPayment']);

    // Thanh Toán & Công Nợ API (Spec Hình 45 & Mục 6.3)
    Route::get('/payments/debts', [PaymentController::class, 'debts']);
    Route::get('/payments/debts/summary', [PaymentController::class, 'summary']);
    Route::get('/payments/debts/{invoice}', [PaymentController::class, 'showDebt']);
    Route::get('/invoices/{invoice}/payments', [PaymentController::class, 'invoiceTransactions']);
    Route::post('/invoices/{invoice}/payments/qr', [PaymentController::class, 'createQrPayment']);
    Route::get('/payment-transactions/{transaction_code}', [PaymentController::class, 'showTransaction']);
    Route::post('/payment-transactions/{transaction_code}/cancel', [PaymentController::class, 'cancelQrPayment']);
    Route::post('/payment-transactions/{id}/cancel-manual', [PaymentController::class, 'cancelManualPayment']);

    // Quản lý Tiền Cọc API (Spec Hình 44 & Mục 5)
    Route::get('/deposits', [DepositController::class, 'index']);
    Route::get('/deposits/summary', [DepositController::class, 'summary']);
    Route::get('/deposits/options', [DepositController::class, 'options']);
    Route::get('/deposits/{deposit}', [DepositController::class, 'show']);
    Route::post('/deposits/{deposit}/collect', [DepositController::class, 'collect']);
    Route::post('/deposits/{deposit}/refund', [DepositController::class, 'refund']);
    Route::patch('/deposits/{deposit}', [DepositController::class, 'update']);
    Route::post('/deposit-movements/{transaction}/void', [DepositController::class, 'voidMovement']);
    Route::get('/my-deposits', [DepositController::class, 'myDeposits']);
    Route::get('/contracts/{contract}/deposit', [DepositController::class, 'showByContract']);
});

// Cổng thanh toán công khai (Public IPN Callback & Redirect Return)
Route::post('/payments/{gateway}/ipn', [PaymentController::class, 'handleIpn'])
    ->middleware('throttle:120,1');
Route::get('/payments/{gateway}/return', [PaymentController::class, 'handleReturn']);

// Cổng giả lập MockGateway (Chỉ bật trên Local / Testing)
Route::get('/mock-gateway/pay/{transaction_code}', [PaymentController::class, 'mockPaymentInfo']);
Route::post('/mock-gateway/pay/{transaction_code}/{action}', [PaymentController::class, 'mockPaymentAction']);

