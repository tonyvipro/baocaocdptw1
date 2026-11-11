<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Enums\Role;
use App\Http\Requests\AssignRoleRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Services\RoleCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['role']);
        
        if ($search = $request->input('search')) {
            $search = mb_substr(trim($search), 0, 250);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($roleId = $request->input('role_id')) {
            if ($roleId !== 'all') {
                $query->where('role_id', $roleId);
            }
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Lấy danh sách căn hộ / đơn vị thật từ cơ sở dữ liệu phục vụ dropdown
     */
    public function unitOptions()
    {
        $properties = DB::table('properties')
            ->whereNull('deleted_at')
            ->select('id', 'code', 'title')
            ->orderBy('code')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $properties
        ]);
    }

    /**
     * Lấy danh sách tất cả vai trò trong hệ thống kèm số lượng tài khoản
     */
    public function getRoles(RoleCatalog $catalog)
    {
        return response()->json([
            'status' => 'success',
            'data' => $catalog->all()
        ]);
    }

    /**
     * Gán vai trò (Phân quyền) cho tài khoản người dùng
     */
    public function assignRole(AssignRoleRequest $request, $id, RoleCatalog $catalog)
    {
        try {
            $user = User::findOrFail($id);
            $currentUserId = $request->user()?->id;
            $validated = $request->validated();
            $targetRoleId = (int) $validated['role_id'];

            // Quy tắc bảo vệ 1: Chặn tự hạ quyền chính mình
            if ($currentUserId && (int) $user->id === (int) $currentUserId && $targetRoleId !== Role::Admin->value) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'CANNOT_DEMOTE_SELF',
                    'message' => 'Bạn không thể tự hạ quyền quản trị viên của chính mình.',
                ], 403);
            }

            // Optimistic concurrency control (Multi-tab conflict prevention)
            if ($request->filled('last_updated_at')) {
                $dbTime = strtotime($user->updated_at);
                $reqTime = strtotime($request->input('last_updated_at'));
                if ($dbTime && $reqTime && abs($dbTime - $reqTime) > 1) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Lỗi xung đột: Thông tin tài khoản này vừa được cập nhật ở phiên làm việc khác. Vui lòng tải lại dữ liệu!'
                    ], 409);
                }
            }

            $oldRoleName = $user->role ? $user->role->name : 'Chưa phân quyền';

            $result = DB::transaction(function () use ($user, $validated, $catalog, $targetRoleId) {
                // Quy tắc bảo vệ 2: Bảo vệ Admin hoạt động cuối cùng
                $blockResponse = $this->guardLastActiveAdmin($user, 'demote', $targetRoleId);
                if ($blockResponse) {
                    return $blockResponse;
                }

                $catalog->ensure(Role::from($targetRoleId));
                $user->role_id = $targetRoleId;
                $user->save();
                $user->load('role');

                return $user;
            });

            if ($result instanceof \Illuminate\Http\JsonResponse) {
                return $result;
            }

            return response()->json([
                'status' => 'success',
                'message' => "Đã gán vai trò '{$user->role->name}' thành công cho tài khoản {$user->name}!",
                'data' => $user,
                'meta' => [
                    'old_role' => $oldRoleName,
                    'new_role' => $user->role->name,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tài khoản này không tồn tại hoặc đã bị xóa trước đó.'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('role')->findOrFail($id);
            return response()->json($user);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không hợp lệ! Mục này có thể đã bị xóa trước đó.'
            ], 404);
        }
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['unit'] = !empty($validated['unit']) ? trim($validated['unit']) : null;

        $user = DB::transaction(function () use ($validated) {
            app(RoleCatalog::class)->ensure(Role::from((int) $validated['role_id']));
            return User::create($validated);
        });
        $user->load('role');

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm người dùng mới thành công.',
            'user' => $user
        ], 201);
    }

    public function update(UpdateUserRequest $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $currentUserId = $request->user()?->id;
            $validated = $request->validated();

            // Quy tắc bảo vệ 1: Chặn tự khóa / tự hạ quyền chính mình
            if ($currentUserId && (int) $user->id === (int) $currentUserId) {
                if (isset($validated['is_active']) && !(bool) $validated['is_active']) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'CANNOT_DEACTIVATE_SELF',
                        'message' => 'Bạn không thể tự khóa tài khoản của chính mình.',
                    ], 403);
                }

                if (isset($validated['role_id']) && (int) $validated['role_id'] !== Role::Admin->value) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 'CANNOT_DEMOTE_SELF',
                        'message' => 'Bạn không thể tự hạ quyền quản trị viên của chính mình.',
                    ], 403);
                }
            }

            // Optimistic Concurrency Control
            if ($request->has('last_updated_at') && $user->updated_at->toIso8601String() !== $request->input('last_updated_at') && $user->updated_at->format('Y-m-d\TH:i:s.u\Z') !== $request->input('last_updated_at') && (string)$user->updated_at !== $request->input('last_updated_at')) {
                $dbTime = strtotime($user->updated_at);
                $reqTime = strtotime($request->input('last_updated_at'));
                if ($dbTime !== $reqTime) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Lỗi: Dữ liệu đã bị thay đổi bởi người khác trước đó. Vui lòng tải lại trang để xem dữ liệu mới nhất.'
                    ], 409);
                }
            }

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            if (array_key_exists('unit', $validated)) {
                $validated['unit'] = !empty($validated['unit']) ? trim($validated['unit']) : null;
            }

            $updateResult = DB::transaction(function () use ($user, $validated) {
                // Quy tắc bảo vệ 2: Bảo vệ Admin hoạt động cuối cùng khi khóa hoặc hạ quyền
                $targetRole = isset($validated['role_id']) ? (int) $validated['role_id'] : null;
                $targetActive = isset($validated['is_active']) ? (bool) $validated['is_active'] : null;

                $blockResponse = $this->guardLastActiveAdmin($user, 'update', $targetRole, $targetActive);
                if ($blockResponse) {
                    return $blockResponse;
                }

                if (isset($validated['role_id'])) {
                    app(RoleCatalog::class)->ensure(Role::from((int) $validated['role_id']));
                }
                $user->update($validated);
                return $user;
            });

            if ($updateResult instanceof \Illuminate\Http\JsonResponse) {
                return $updateResult;
            }

            $user->load('role');

            return response()->json([
                'status' => 'success',
                'message' => 'Cập nhật thông tin thành công.',
                'user' => $user
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sửa không hợp lệ! Mục này có thể đã bị xóa trước đó.'
            ], 404);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $currentUserId = $request->user()?->id;

            // Quy tắc bảo vệ 1: Chặn tự xóa chính mình
            if ($currentUserId && (int) $user->id === (int) $currentUserId) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'CANNOT_DELETE_SELF',
                    'message' => 'Bạn không thể tự xóa tài khoản của chính mình.',
                ], 403);
            }

            $deleteResult = DB::transaction(function () use ($user) {
                // Quy tắc bảo vệ 2: Bảo vệ Admin hoạt động cuối cùng
                $blockResponse = $this->guardLastActiveAdmin($user, 'delete');
                if ($blockResponse) {
                    return $blockResponse;
                }

                $user->delete();
                return true;
            });

            if ($deleteResult instanceof \Illuminate\Http\JsonResponse) {
                return $deleteResult;
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Xóa người dùng thành công.'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Xóa không hợp lệ! Mục này có thể đã bị xóa trước đó.'
            ], 404);
        }
    }

    /**
     * Quy tắc bảo vệ Admin hoạt động cuối cùng (Lock bi quan lockForUpdate trong DB::transaction)
     */
    private function guardLastActiveAdmin(User $targetUser, string $action, ?int $newRoleId = null, ?bool $newIsActive = null): ?\Illuminate\Http\JsonResponse
    {
        $isCurrentlyActiveAdmin = ((int) $targetUser->role_id === Role::Admin->value && (bool) $targetUser->is_active);

        if (!$isCurrentlyActiveAdmin) {
            return null;
        }

        $willLoseActiveAdmin = false;
        if ($action === 'delete') {
            $willLoseActiveAdmin = true;
        } elseif ($newIsActive !== null && !$newIsActive) {
            $willLoseActiveAdmin = true;
        } elseif ($newRoleId !== null && $newRoleId !== Role::Admin->value) {
            $willLoseActiveAdmin = true;
        }

        if (!$willLoseActiveAdmin) {
            return null;
        }

        // Đếm số lượng Admin đang active bằng lockForUpdate
        $activeAdminCount = User::where('role_id', Role::Admin->value)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->lockForUpdate()
            ->count();

        if ($activeAdminCount <= 1) {
            return response()->json([
                'status' => 'error',
                'error_code' => 'LAST_ACTIVE_ADMIN_PROTECTED',
                'message' => 'Không thể khóa, xóa hoặc hạ quyền Quản trị viên đang hoạt động cuối cùng trong hệ thống.',
            ], 422);
        }

        return null;
    }
}
