<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Đăng ký tài khoản mới (Spec Hình 6, 7, 8 & Chương 6)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:191|unique:users,email',
            'password' => 'required|string|min:8|max:32|confirmed',
            'phone' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập họ và tên của bạn.',
            'name.max' => 'Họ và tên không được vượt quá 255 ký tự.',
            'email.required' => 'Vui lòng nhập địa chỉ email của bạn.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 191 ký tự.',
            'email.unique' => 'Email này bị trùng mất rồi! Vui lòng chọn email khác.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.max' => 'Mật khẩu không được dài quá 32 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Tìm hoặc gán role mặc định: Customer (Khách hàng)
        $defaultRole = Role::where('name', 'Customer')->orWhere('name', 'Khách hàng')->first();
        $roleId = $defaultRole ? $defaultRole->id : null;

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'phone' => $request->phone ? trim($request->phone) : null,
            'role_id' => $roleId,
            'is_active' => 1,
            'dark_mode' => 0,
        ]);

        // Tự động đăng nhập
        Auth::login($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Tài khoản của bạn đã được tạo thành công!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role ? $user->role->name : 'Khách hàng',
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'dark_mode' => $user->dark_mode,
            ]
        ], 201);
    }

    /**
     * Đăng nhập tài khoản (Spec Hình 5 & Chương 6)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Vui lòng nhập email đăng nhập.',
            'email.email' => 'Email không đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = [
            'email' => strtolower(trim($request->email)),
            'password' => $request->password,
        ];

        $remember = $request->boolean('remember', true);

        if (!Auth::attempt($credentials, $remember)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email hoặc mật khẩu không chính xác! Vui lòng thử lại.'
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->is_active === 0 || $user->is_active === false) {
            Auth::logout();
            return response()->json([
                'status' => 'error',
                'message' => 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.'
            ], 403);
        }

        $request->session()->regenerate();

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng nhập thành công!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role ? $user->role->name : 'Thành viên',
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'dark_mode' => $user->dark_mode,
            ]
        ]);
    }

    /**
     * Lấy thông tin tài khoản hiện tại (Spec Me)
     */
    public function me(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Chưa đăng nhập.'
            ], 401);
        }

        $user = Auth::user();
        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role ? $user->role->name : 'Thành viên',
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'dark_mode' => $user->dark_mode,
            ]
        ]);
    }

    /**
     * Đăng xuất tài khoản
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng xuất thành công!'
        ]);
    }

    /**
     * Cập nhật thông tin hồ sơ (Spec Hình 9)
     */
    public function updateProfile(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập.'], 401);
        }

        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string|max:255',
            'dark_mode' => 'nullable|boolean',
        ], [
            'name.required' => 'Họ và tên không được để trống.',
            'name.max' => 'Họ và tên không được vượt quá 255 ký tự.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user->update([
            'name' => trim($request->name),
            'phone' => $request->phone ? trim($request->phone) : $user->phone,
            'avatar' => $request->avatar ?: $user->avatar,
            'dark_mode' => $request->has('dark_mode') ? $request->boolean('dark_mode') : $user->dark_mode,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật hồ sơ thành công!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role ? $user->role->name : 'Thành viên',
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'dark_mode' => $user->dark_mode,
            ]
        ]);
    }

    /**
     * Quản lý mật khẩu / Đổi mật khẩu (Spec Hình 10)
     */
    public function changePassword(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|max:32|confirmed',
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
            'password.max' => 'Mật khẩu mới không được vượt quá 32 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Mật khẩu hiện tại không chính xác!'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Đổi mật khẩu thành công!'
        ]);
    }
}
