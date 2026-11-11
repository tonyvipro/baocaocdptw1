<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationInbox;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class NotificationController extends Controller
{
    private function user(Request $request): User
    {
        $user = $request->bearerToken() ? auth('sanctum')->user() : $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập để xem thông báo và nhật ký.');
        return $user;
    }

    private function logs(User $user, ?Request $request = null)
    {
        $query = ActivityLog::query()->with('user');

        // Phân quyền phạm vi nhật ký:
        // Nếu không có quyền 'logs.view_all', CHỈ được xem nhật ký của chính mình (theo user_id hoặc actor_id)
        if (!$user->hasPermission('logs.view_all')) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('actor_id', $user->id);
            });
        } elseif ($request) {
            // Admin / người có logs.view_all có thể lọc theo người thực hiện (actor_id hoặc user_id)
            $targetActor = $request->input('actor_id') ?? $request->input('user_id');
            if (!empty($targetActor)) {
                $query->where(function ($q) use ($targetActor) {
                    $q->where('user_id', $targetActor)
                      ->orWhere('actor_id', $targetActor);
                });
            }
        }

        if ($request) {
            // Lọc theo loại thao tác (action)
            if ($request->filled('action')) {
                $query->where('action', $request->input('action'));
            }

            // Lọc theo bảng / đối tượng (table_name)
            if ($request->filled('table_name')) {
                $query->where('table_name', $request->input('table_name'));
            }

            // Lọc theo thời gian (start_date, end_date) theo timezone Asia/Ho_Chi_Minh
            if ($request->filled('start_date')) {
                try {
                    $startDate = Carbon::parse($request->input('start_date'), 'Asia/Ho_Chi_Minh')->startOfDay()->setTimezone('UTC');
                    $query->where('created_at', '>=', $startDate);
                } catch (\Throwable $e) {}
            }
            if ($request->filled('end_date')) {
                try {
                    $endDate = Carbon::parse($request->input('end_date'), 'Asia/Ho_Chi_Minh')->endOfDay()->setTimezone('UTC');
                    $query->where('created_at', '<=', $endDate);
                } catch (\Throwable $e) {}
            }
        }

        return $query;
    }

    private function notification($notification, User $viewer): array
    {
        $data = is_array($notification->data) ? $notification->data : [];
        $type = (string) ($data['category'] ?? $data['type'] ?? $notification->type);
        $category = match (true) {
            str_contains(strtolower($type), 'payment') => 'Thanh toán',
            str_contains(strtolower($type), 'warning'), str_contains(strtolower($type), 'alert') => 'Cảnh báo',
            str_contains(strtolower($type), 'contract') => 'Hợp đồng',
            str_contains(strtolower($type), 'appointment') => 'Lịch hẹn',
            str_contains(strtolower($type), 'profile') => 'Cập nhật hồ sơ',
            default => 'Hệ thống',
        };
        $message = $data['message'] ?? $data['title'] ?? 'Bạn có thông báo mới.';
        return [
            'id' => $notification->id,
            'created_at' => $notification->created_at,
            'category' => $category,
            'message' => is_string($message) ? $message : 'Bạn có thông báo mới.',
            'read_at' => $notification->read_at,
            'destination' => app(\App\Services\ActivityDestination::class)->notification($viewer, $data),
        ];
    }

    private function log(ActivityLog $log, User $viewer): array
    {
        $labels = [
            'LOGIN' => 'Đăng nhập', 'LOGOUT' => 'Đăng xuất', 'PROFILE_UPDATE' => 'Cập nhật hồ sơ',
            'CONTRACT_SIGN' => 'Ký hợp đồng', 'CONTRACT_CREATE' => 'Tạo hợp đồng', 'CONTRACT_UPDATE' => 'Cập nhật hợp đồng',
            'CONTRACT_DELETE' => 'Xóa hợp đồng', 'CUSTOMER_CREATE' => 'Thêm khách hàng', 'CUSTOMER_UPDATE' => 'Cập nhật khách hàng',
            'CUSTOMER_DELETE' => 'Xóa khách hàng', 'DEMAND_CREATE' => 'Thêm nhu cầu', 'DEMAND_UPDATE' => 'Cập nhật nhu cầu', 'DEMAND_DELETE' => 'Xóa nhu cầu', 'CREATE' => 'Tạo mới', 'UPDATE' => 'Cập nhật', 'DELETE' => 'Xóa',
            'VIEW' => 'Xem bất động sản', 'STATUS_CHANGE' => 'Đổi trạng thái tin', 'EXTEND' => 'Gia hạn tin',
            'SUBMIT_CONTRACT_EXTENSION' => 'Gửi gia hạn hợp đồng', 'APPROVE_CONTRACT_EXTENSION' => 'Duyệt gia hạn hợp đồng',
            'REJECT_CONTRACT_EXTENSION' => 'Từ chối gia hạn hợp đồng',
        ];
        $tables = [
            'properties' => 'Bất động sản', 'users' => 'Tài khoản', 'contracts' => 'Hợp đồng', 'customers' => 'Khách hàng',
            'contract_extensions' => 'Gia hạn hợp đồng', 'customer_demands' => 'Nhu cầu', 'categories' => 'Danh mục',
            'brokers' => 'Môi giới', 'broker_assignments' => 'Phân công', 'customer_activities' => 'Lịch chăm sóc',
            'customer_interactions' => 'Tương tác', 'property_types' => 'Loại BĐS',
        ];

        $changes = $log->new_data['changes'] ?? null;
        if (!is_array($changes)) {
            $changes = is_array($log->old_data) && is_array($log->new_data)
                ? app(\App\Services\AuditChanges::class)->changes($log->table_name, $log->old_data, $log->new_data) : [];
        }
        $details = $log->new_data['description'] ?? null;
        if (!is_string($details)) $details = ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id;
        if ($changes && !isset($log->new_data['changes'])) $details = ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id.': '.app(\App\Services\AuditChanges::class)->describe($changes);

        $roles = [1 => 'Admin', 2 => 'Môi giới', 3 => 'Chủ sở hữu', 4 => 'Nhân viên', 5 => 'Khách hàng'];
        $actorName = $log->actor_name ?? $log->actor_snapshot['name'] ?? $log->user?->name;
        $actorRole = $log->actor_role ?? $log->actor_snapshot['role_name'] ?? ($roles[(int) ($log->user?->role_id ?? $log->actor_id ?? 0)] ?? null);

        if ($actorName) {
            $name = $actorName . ($actorRole ? ' (' . $actorRole . ')' : '');
        } else {
            $name = $log->user ? $log->user->name . ' (' . ($roles[(int) $log->user->role_id] ?? 'Người dùng') . ')' : 'Hệ thống';
        }

        return [
            'id' => $log->id,
            'actor_id' => $log->actor_id ?? $log->user_id,
            'actor_name' => $actorName,
            'actor_role' => $actorRole,
            'created_at' => $log->created_at,
            'user' => $name,
            'action' => $labels[$log->action] ?? 'Thao tác hệ thống',
            'raw_action' => $log->action,
            'table_name' => $log->table_name,
            'record_id' => $log->record_id,
            'details' => $details,
            'changes' => $changes,
            'subject' => ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id,
            'destination' => app(\App\Services\ActivityDestination::class)->record($viewer, $log->table_name, (int) $log->record_id, $log->action),
        ];
    }

    private function page($paginator, $transform): array
    {
        return [
            'data' => $paginator->getCollection()->map($transform)->values(),
            'meta' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }

    public function index(Request $request, NotificationInbox $inbox)
    {
        $user = $this->user($request);
        $request->validate([
            'notification_page' => 'nullable|integer|min:1',
            'log_page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'action' => 'nullable|string|max:100',
            'actor_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'table_name' => 'nullable|string|max:100',
        ]);
        $perPage = (int) $request->input('per_page', 10);
        $inbox->synchronize($user);

        return response()->json([
            'notifications' => $this->page(
                $user->notifications()->orderByDesc('id')->paginate($perPage, ['*'], 'notification_page'),
                fn ($row) => $this->notification($row, $user)
            ),
            'logs' => $this->page(
                $this->logs($user, $request)->orderByDesc('id')->paginate($perPage, ['*'], 'log_page'),
                fn ($row) => $this->log($row, $user)
            ),
            'unread_count' => $user->unreadNotifications()->count(),
            'log_scope' => $user->hasPermission('logs.view_all') ? 'system' : 'personal',
            'filters' => [
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'action' => $request->input('action'),
                'actor_id' => $user->hasPermission('logs.view_all') ? ($request->input('actor_id') ?? $request->input('user_id')) : $user->id,
            ],
        ]);
    }

    public function activityLogs(Request $request)
    {
        $user = $this->user($request);
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'action' => 'nullable|string|max:100',
            'actor_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'table_name' => 'nullable|string|max:100',
        ]);
        $perPage = (int) $request->input('per_page', 15);

        return response()->json(
            $this->page(
                $this->logs($user, $request)->orderByDesc('id')->paginate($perPage, ['*'], 'page'),
                fn ($row) => $this->log($row, $user)
            )
        );
    }

    public function unreadCount(Request $request, NotificationInbox $inbox)
    {
        $user = $this->user($request);
        $inbox->synchronize($user);
        return response()->json(['unread_count' => $user->unreadNotifications()->count()]);
    }

    public function markAllRead(Request $request, NotificationInbox $inbox)
    {
        $user = $this->user($request);
        $inbox->synchronize($user);
        $count = $user->unreadNotifications()->update(['read_at' => now(), 'updated_at' => now()]);
        return response()->json([
            'status' => 'success',
            'message' => 'Đã đánh dấu tất cả thông báo là đã đọc.',
            'updated' => $count,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function downloadLogs(Request $request)
    {
        $user = $this->user($request);
        $logQuery = $this->logs($user, $request);
        $maximumId = (clone $logQuery)->max('id') ?? 0;

        return response()->streamDownload(function () use ($user, $maximumId, $logQuery) {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['Ngày', 'Người dùng', 'Hoạt động', 'Chi tiết'], ',', '"', '');
            (clone $logQuery)->where('id', '<=', $maximumId)->orderByDesc('id')->chunkById(200, function ($rows) use ($stream, $user) {
                foreach ($rows as $row) {
                    $item = $this->log($row, $user);
                    $cells = [$row->created_at->timezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i:s'), $item['user'], $item['action'], $item['details']];
                    $cells = array_map(fn ($cell) => preg_match('/^[\s]*[=+@-]|^[\t\r\n]/u', $cell) ? "'".$cell : $cell, $cells);
                    fputcsv($stream, $cells, ',', '"', '');
                }
            });
            fclose($stream);
        }, 'nhat-ky-hoat-dong-'.now('Asia/Ho_Chi_Minh')->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }
}
