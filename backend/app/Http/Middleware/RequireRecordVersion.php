<?php

namespace App\Http\Middleware;

use Closure;
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
            if ($table === 'users' && (int) $record->role_id === 1 && $record->is_active
                && ($request->isMethod('delete') || ($request->has('role_id') && (int) $request->input('role_id') !== 1)
                    || ($request->has('is_active') && !$request->boolean('is_active')))) {
                $admins = DB::table('users')->where('role_id', 1)->where('is_active', true)->whereNull('deleted_at')->lockForUpdate()->get();
                abort_if($admins->count() <= 1, 422, 'Không thể xóa, khóa hoặc hạ quyền quản trị viên hoạt động cuối cùng.');
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
