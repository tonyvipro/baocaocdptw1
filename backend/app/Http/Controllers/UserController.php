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
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);
        
        // Add dummy 'unit' since it's not in DB schema but requested in UI
        $users->getCollection()->transform(function ($user) {
            $user->unit = 'A101'; // Mock unit
            return $user;
        });

        return response()->json($users);
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
