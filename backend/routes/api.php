<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContractExtensionController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
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
});
