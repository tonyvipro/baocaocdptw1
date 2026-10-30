<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContractExtensionController;
use App\Http\Controllers\ContractDocumentController;
use App\Http\Controllers\CustomerContractController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MyInvoiceController;

Route::get('/search/properties', \App\Http\Controllers\PropertySearchController::class)
    ->middleware('throttle:120,1');
use App\Http\Controllers\Api\RentPaymentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\MetaController;

// Public Metadata API
Route::get('/meta/field-limits', [MetaController::class, 'fieldLimits']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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

