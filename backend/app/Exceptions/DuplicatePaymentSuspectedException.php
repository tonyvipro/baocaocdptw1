<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class DuplicatePaymentSuspectedException extends Exception
{
    public function __construct(string $message = 'Có khoản thanh toán tương tự vừa được ghi nhận. Bạn có chắc muốn ghi nhận thêm?')
    {
        parent::__construct($message, 409);
    }

    public function render($request): JsonResponse
    {
        return response()->json([
            'code' => 'DUPLICATE_SUSPECTED',
            'message' => $this->getMessage(),
        ], 409);
    }
}
