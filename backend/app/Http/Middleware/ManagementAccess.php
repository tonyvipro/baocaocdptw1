<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ManagementAccess
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user('sanctum') ?? $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập bằng tài khoản đang hoạt động.');
        if (!$user->hasPermission($permission)) {
            return response()->json(['message' => 'Bạn không có quyền sử dụng chức năng này.',
                'code' => 'FORBIDDEN', 'permission' => $permission], 403);
        }
        return $next($request);
    }
}
