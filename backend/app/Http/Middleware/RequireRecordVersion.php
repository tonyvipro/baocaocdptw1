<?php

namespace App\Http\Middleware;

use Closure;
use App\Enums\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Lock and compare inside one transaction, including same-second writes. */
class RequireRecordVersion
{
    public function handle(Request $request, Closure $next, string $table)
    {
        $actor = $request->user('sanctum') ?? $request->user();
        abort_unless($actor && $actor->is_active, 401, 'Vui lòng đăng nhập lại.');
        $id = $request->route('id') ?? $actor->id;
        return DB::transaction(function () use ($request, $next, $table, $id, $actor) {
            $record = DB::table($table)->where('id', $id)->whereNull('deleted_at')->lockForUpdate()->first();
            abort_unless($record, 404, 'Dữ liệu không còn tồn tại.');
            $expected = $request->input('version');
            if (filter_var($expected, FILTER_VALIDATE_INT) === false || (int) $expected !== (int) $record->version) {
                return response()->json([
                    'code' => 'STALE_VERSION',
                    'message' => 'Dữ liệu đã thay đổi hoặc thiếu phiên bản. Vui lòng tải lại dữ liệu trước khi sửa.',
                ], 409);
            }
            // Quy tắc bảo vệ 1: Chặn tự xóa / tự khóa / tự hạ quyền chính mình
            if ($table === 'users' && (int) $id === (int) $actor->id) {
                if ($request->isMethod('delete')) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'CANNOT_DELETE_SELF',
                        'message' => 'Bạn không thể tự xóa tài khoản của chính mình.',
                    ], 403);
                }
                if ($request->has('is_active') && !$request->boolean('is_active')) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'CANNOT_DEACTIVATE_SELF',
                        'message' => 'Bạn không thể tự khóa tài khoản của chính mình.',
                    ], 403);
                }
                if ($request->has('role_id') && (int) $request->input('role_id') !== Role::Admin->value) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'CANNOT_DEMOTE_SELF',
                        'message' => 'Bạn không thể tự hạ quyền quản trị viên của chính mình.',
                    ], 403);
                }
            }

            // Quy tắc bảo vệ 2: Bảo vệ Admin hoạt động cuối cùng
            if ($table === 'users' && (int) $record->role_id === Role::Admin->value && $record->is_active
                && ($request->isMethod('delete') || ($request->has('role_id') && (int) $request->input('role_id') !== Role::Admin->value)
                    || ($request->has('is_active') && !$request->boolean('is_active')))) {
                $admins = DB::table('users')->where('role_id', Role::Admin->value)->where('is_active', true)->whereNull('deleted_at')->lockForUpdate()->get();
                if ($admins->count() <= 1) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'LAST_ACTIVE_ADMIN_PROTECTED',
                        'message' => 'Không thể xóa, khóa hoặc hạ quyền quản trị viên hoạt động cuối cùng.',
                    ], 422);
                }
            }
            // Increment without changing updated_at before legacy controller validation.
            DB::table($table)->where('id', $id)->update(['version' => $record->version + 1]);
            if ($table === 'users' && (int) $id === (int) $actor->id) $actor->refresh();
            $response = $next($request);
            if ($response->getStatusCode() >= 400) {
                // Roll back every write when a controller returns an error response.
                throw new \Illuminate\Http\Exceptions\HttpResponseException($response);
            }
            return $response;
        });
    }
}
