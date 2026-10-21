<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContractExtensionController;
use App\Http\Controllers\ContractDocumentController;
use App\Http\Controllers\CustomerContractController;

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
});
