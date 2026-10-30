<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    /**
     * Đăng ký tài khoản mới (Spec Hình 6, 7, 8 & Chương 6)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:250',
            'email' => 'required|string|email|max:191|unique:users,email',
            'password' => 'required|string|min:8|max:32|confirmed',
            'password_confirmation' => 'required|string|min:8|max:32',
            'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
        ], [
            'name.required' => 'Vui lòng nhập họ và tên của bạn.',
            'name.max' => 'Họ và tên không được vượt quá 250 ký tự.',
            'email.required' => 'Vui lòng nhập địa chỉ email của bạn.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 191 ký tự.',
            'email.unique' => 'Email này bị trùng mất rồi! Vui lòng chọn email khác.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.max' => 'Mật khẩu không được dài quá 32 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không trùng khớp.',
            'password_confirmation.required' => 'Vui lòng xác nhận mật khẩu.',
            'password_confirmation.min' => 'Xác nhận mật khẩu phải có ít nhất 8 ký tự.',
            'password_confirmation.max' => 'Xác nhận mật khẩu không được dài quá 32 ký tự.',
            'phone.string' => 'Số điện thoại phải bao gồm từ 10 đến 11 chữ số.',
            'phone.regex' => 'Số điện thoại phải bao gồm từ 10 đến 11 chữ số.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Tìm hoặc gán role mặc định: Customer (Khách hàng)
        // Role IDs are used by the authorization policy; registration is always customer (5).
        \Illuminate\Support\Facades\DB::table('roles')->insertOrIgnore([
            'id' => 5, 'name' => 'Customer', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $roleId = 5;

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
                'version' => (int) ($user->version ?? 1),
            ],
            'token' => $user->createToken('auth_token')->plainTextToken
        ], 201);
    }

    /**
     * Đăng nhập tài khoản (Spec Hình 5 & Chương 6)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
        ], [
            'email.required' => 'Vui lòng nhập email hoặc tài khoản đăng nhập.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $inputLogin = strtolower(trim($request->input('email', '')));
        $password = $request->input('password', '');
        $remember = $request->boolean('remember', true);

        // Tìm người dùng theo email hoặc username 'admin'
        $user = null;
        if (in_array($inputLogin, ['admin', 'administrator'])) {
            $user = User::where('email', 'admin@3tvland.vn')->orWhere('role_id', 1)->first();
        } else {
            $user = User::where('email', $inputLogin)->first();
        }

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tài khoản không tồn tại trong hệ thống. Vui lòng kiểm tra lại email/tên đăng nhập!'
            ], 401);
        }

        $isAdmin = (int) $user->role_id === 1;
        $validPassword = Hash::check($password, $user->password);

        if (!$validPassword) {
            return response()->json([
                'status' => 'error',
                'message' => 'Mật khẩu không chính xác! Vui lòng thử lại.'
            ], 401);
        }

        if ($user->is_active === 0 || $user->is_active === false) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.'
            ], 403);
        }

        // Đăng nhập user vào session
        Auth::login($user, $remember);
        try {
            $request->session()->regenerate();
        } catch (\Throwable $e) {}

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng nhập thành công!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role ? $user->role->name : ($isAdmin ? 'Admin' : 'Thành viên'),
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'dark_mode' => $user->dark_mode,
                'version' => (int) ($user->version ?? 1),
            ],
            'token' => $user->createToken('auth_token')->plainTextToken
        ]);
    }

    /**
     * Xác thực và nhận diện người dùng hiện tại một cách an toàn và linh hoạt
     * Hỗ trợ: Bearer token (Sanctum), Session, User ID/Email từ payload
     */
    protected function getAuthenticatedUser(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();
        return $user && $user->is_active ? $user : null;
    }

    /**
     * Lấy thông tin tài khoản hiện tại (Spec Me)
     */
    public function me(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Chưa đăng nhập.'
            ], 401);
        }

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
                'version' => (int) ($user->version ?? 1),
            ]
        ]);
    }

    /**
     * Đăng xuất tài khoản
     */
    public function logout(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        $token = $user?->currentAccessToken();
        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) $token->delete();
        Auth::logout();
        try {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } catch (\Throwable $e) {}

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
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:250',
            'phone' => ['nullable', 'string', 'regex:/^[0-9]{10,11}$/D'],
            'avatar' => 'nullable|string',
            'dark_mode' => 'nullable|boolean',
        ], [
            'name.required' => 'Họ và tên không được để trống.',
            'name.max' => 'Họ và tên không được vượt quá 250 ký tự.',
            'phone.regex' => 'Số điện thoại phải bao gồm từ 10 đến 11 chữ số.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $avatarUrl = $user->avatar;
        if ($request->filled('avatar')) {
            $avatarInput = $request->avatar;
            if (str_starts_with($avatarInput, 'data:image/')) {
                try {
                    $commaPos = strpos($avatarInput, ',');
                    if ($commaPos !== false) {
                        $rawBase64 = substr($avatarInput, $commaPos + 1);
                        $imgData = base64_decode($rawBase64);

                        if ($imgData !== false) {
                            $savedPath = $this->processAndSaveAvatar($imgData, $user->id);
                            if ($savedPath) {
                                // Xóa avatar cũ trên đĩa nếu là file cục bộ để tiết kiệm dung lượng
                                if ($user->avatar && str_starts_with($user->avatar, '/uploads/avatars/')) {
                                    $oldPath = public_path(ltrim($user->avatar, '/'));
                                    if (file_exists($oldPath)) {
                                        @unlink($oldPath);
                                    }
                                }
                                $avatarUrl = $savedPath;
                            }
                        }
                    }
                } catch (\Throwable $e) {}

                // Fallback nếu không ghi được file đĩa thì dùng trực tiếp base64 data URI
                if (!$avatarUrl || $avatarUrl === $user->avatar) {
                    $avatarUrl = $avatarInput;
                }
            } else {
                $avatarUrl = $avatarInput;
            }
        }

        $user->update([
            'name' => trim($request->name),
            'phone' => $request->phone ? trim($request->phone) : $user->phone,
            'avatar' => $avatarUrl,
            'dark_mode' => $request->has('dark_mode') ? $request->boolean('dark_mode') : $user->dark_mode,
        ]);

        try {
            Auth::setUser($user);
        } catch (\Throwable $e) {}

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
                'version' => (int) ($user->version ?? 1),
            ]
        ]);
    }

    /**
     * Quản lý mật khẩu / Đổi mật khẩu (Spec Hình 10)
     */
    public function changePassword(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
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
            'message' => 'Đổi mật khẩu thành công!',
            'version' => (int) $user->version
        ]);
    }

    /**
     * Tối ưu hóa kích thước ảnh đại diện (Nén, resize max 320x320 dạng WebP/JPEG thumbnail)
     */
    private function processAndSaveAvatar(string $imgData, int $userId): ?string
    {
        $uploadDir = public_path('uploads/avatars');
        if (!file_exists($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        $filename = 'avatar_' . $userId . '_' . time() . '.webp';
        $targetPath = $uploadDir . '/' . $filename;

        // Xử lý nén ảnh qua GD library
        if (function_exists('imagecreatefromstring')) {
            $src = @imagecreatefromstring($imgData);
            if ($src !== false) {
                $width = imagesx($src);
                $height = imagesy($src);

                $maxDim = 320;
                $newWidth = $width;
                $newHeight = $height;

                if ($width > $maxDim || $height > $maxDim) {
                    if ($width > $height) {
                        $newWidth = $maxDim;
                        $newHeight = (int) round(($height * $maxDim) / $width);
                    } else {
                        $newHeight = $maxDim;
                        $newWidth = (int) round(($width * $maxDim) / $height);
                    }
                }

                $dst = imagecreatetruecolor($newWidth, $newHeight);
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

                if (function_exists('imagewebp')) {
                    imagewebp($dst, $targetPath, 82);
                    imagedestroy($src);
                    imagedestroy($dst);
                    return '/uploads/avatars/' . $filename;
                } elseif (function_exists('imagejpeg')) {
                    $jpgFilename = 'avatar_' . $userId . '_' . time() . '.jpg';
                    imagejpeg($dst, $uploadDir . '/' . $jpgFilename, 82);
                    imagedestroy($src);
                    imagedestroy($dst);
                    return '/uploads/avatars/' . $jpgFilename;
                }
                imagedestroy($src);
                imagedestroy($dst);
            }
        }

        // Fallback ghi file thông thường nếu GD không khả dụng
        $rawFile = 'avatar_' . $userId . '_' . time() . '.jpg';
        @file_put_contents($uploadDir . '/' . $rawFile, $imgData);
        return '/uploads/avatars/' . $rawFile;
    }
}
