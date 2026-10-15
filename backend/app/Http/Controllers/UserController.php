<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');
        
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
        
        // Add dummy 'unit' since it's not in DB schema but requested in UI
        $users->getCollection()->transform(function ($user) {
            $user->unit = 'A101'; // Mock unit
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Lấy danh sách tất cả vai trò trong hệ thống kèm số lượng tài khoản
     */
    public function getRoles()
    {
        $roles = \App\Models\Role::withCount('users')->orderBy('id', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $roles
        ]);
    }

    /**
     * Gán vai trò (Phân quyền) cho tài khoản người dùng (Chuẩn Hình 11)
     */
    public function assignRole(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'role_id' => 'required|integer|exists:roles,id',
                'note' => 'nullable|string|max:250',
                'last_updated_at' => 'nullable|string'
            ], [
                'role_id.required' => 'Vui lòng chọn vai trò cần gán cho tài khoản.',
                'role_id.exists' => 'Vai trò được chọn không tồn tại trong hệ thống.',
                'note.max' => 'Ghi chú không được vượt quá 250 ký tự.'
            ]);

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
            $user->role_id = $validated['role_id'];
            $user->save();
            $user->load('role');

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
            $user->unit = 'A101';
            return response()->json($user);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không hợp lệ! Mục này có thể đã bị xóa trước đó.'
            ], 404);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:users,name',
            'email' => [
                'required', 'string', 'email', 'max:255', 'unique:users,email',
                function ($attribute, $value, $fail) {
                    if (!str_ends_with(strtolower($value), '@gmail.com')) {
                        $fail('Email bắt buộc phải có đuôi @gmail.com.');
                    }
                }
            ],
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean'
        ], [
            'name.unique' => 'Tên người dùng này đã tồn tại trong hệ thống.',
            'email.unique' => 'Email này đã được sử dụng bởi một tài khoản khác.'
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $user = User::create($validated);
        $user->load('role');
        $user->unit = 'A101';

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm người dùng mới thành công.',
            'user' => $user
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|unique:users,name,'.$id,
                'email' => [
                    'sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$id,
                    function ($attribute, $value, $fail) {
                        if (!str_ends_with(strtolower($value), '@gmail.com')) {
                            $fail('Email bắt buộc phải có đuôi @gmail.com.');
                        }
                    }
                ],
                'password' => 'nullable|string|min:6',
                'role_id' => 'sometimes|exists:roles,id',
                'is_active' => 'boolean',
                'last_updated_at' => 'nullable|string'
            ], [
                'name.unique' => 'Tên người dùng này đã tồn tại trong hệ thống.',
                'email.unique' => 'Email này đã được sử dụng bởi một tài khoản khác.'
            ]);

            // Optimistic Concurrency Control
            if ($request->has('last_updated_at') && $user->updated_at->toIso8601String() !== $request->input('last_updated_at') && $user->updated_at->format('Y-m-d\TH:i:s.u\Z') !== $request->input('last_updated_at') && (string)$user->updated_at !== $request->input('last_updated_at')) {
                // Try simpler comparison to avoid timezone issues: timestamps
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

            $user->update($validated);
            $user->load('role');
            $user->unit = 'A101';

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

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

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
}
