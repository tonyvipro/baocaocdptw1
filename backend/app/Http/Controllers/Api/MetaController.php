<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class MetaController extends Controller
{
    /**
     * Lấy cấu hình giới hạn trường nhập dữ liệu (Spec 3.11a & Bổ sung D)
     * Trả về bảng giới hạn (không chứa dữ liệu nhạy cảm), cache 1 giờ.
     */
    public function fieldLimits(): JsonResponse
    {
        $limits = Cache::remember('meta_field_limits', 3600, function () {
            return config('field_limits', []);
        });

        return response()->json([
            'data' => $limits,
        ]);
    }
}
