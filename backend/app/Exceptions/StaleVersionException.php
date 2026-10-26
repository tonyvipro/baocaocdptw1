<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class StaleVersionException extends Exception
{
    protected mixed $current;

    public function __construct(string $message = 'Dữ liệu đã được người khác thay đổi. Vui lòng tải lại để xem phiên bản mới nhất.', mixed $current = null)
    {
        parent::__construct($message, 409);
        $this->current = $current;
    }

    public function getCurrent(): mixed
    {
        return $this->current;
    }

    public function render($request): JsonResponse
    {
        $payload = [
            'code' => 'STALE_VERSION',
            'message' => $this->getMessage(),
        ];

        if ($this->current !== null) {
            $payload['current'] = $this->current;
        }

        return response()->json($payload, 409);
    }
}
