<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ManagementAccess
{
    public function handle(Request $request, Closure $next, string $roles = '1')
    {
        $user = $request->user('sanctum') ?? $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập bằng tài khoản đang hoạt động.');
        abort_unless(in_array((int) $user->role_id, array_map('intval', explode(',', $roles)), true), 403, 'Bạn không có quyền sử dụng chức năng này.');
        return $next($request);
    }
}
