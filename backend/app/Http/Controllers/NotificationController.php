<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationInbox;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function user(Request $request): User
    {
        $user = $request->bearerToken() ? auth('sanctum')->user() : $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập để xem thông báo và nhật ký.');
        return $user;
    }

    private function logs(User $user)
    {
        return ActivityLog::query()->when((int) $user->role_id !== 1, fn ($query) => $query->where('user_id', $user->id))->with('user');
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
        return ['id' => $notification->id, 'created_at' => $notification->created_at, 'category' => $category,
            'message' => is_string($message) ? $message : 'Bạn có thông báo mới.', 'read_at' => $notification->read_at,
            'destination' => app(\App\Services\ActivityDestination::class)->notification($viewer, $data)];
    }

    private function log(ActivityLog $log, User $viewer): array
    {
        $labels = ['LOGIN' => 'Đăng nhập', 'LOGOUT' => 'Đăng xuất', 'PROFILE_UPDATE' => 'Cập nhật hồ sơ',
            'CONTRACT_SIGN' => 'Ký hợp đồng', 'CONTRACT_CREATE' => 'Tạo hợp đồng', 'CONTRACT_UPDATE' => 'Cập nhật hợp đồng',
            'CONTRACT_DELETE' => 'Xóa hợp đồng', 'CUSTOMER_CREATE' => 'Thêm khách hàng', 'CUSTOMER_UPDATE' => 'Cập nhật khách hàng',
            'CUSTOMER_DELETE' => 'Xóa khách hàng', 'DEMAND_CREATE' => 'Thêm nhu cầu', 'DEMAND_UPDATE' => 'Cập nhật nhu cầu', 'DEMAND_DELETE' => 'Xóa nhu cầu', 'CREATE' => 'Tạo mới', 'UPDATE' => 'Cập nhật', 'DELETE' => 'Xóa',
            'VIEW' => 'Xem bất động sản', 'STATUS_CHANGE' => 'Đổi trạng thái tin', 'EXTEND' => 'Gia hạn tin'];
        $labels += ['SUBMIT_CONTRACT_EXTENSION' => 'Gửi gia hạn hợp đồng', 'APPROVE_CONTRACT_EXTENSION' => 'Duyệt gia hạn hợp đồng',
            'REJECT_CONTRACT_EXTENSION' => 'Từ chối gia hạn hợp đồng'];
        $tables = ['properties' => 'Bất động sản', 'users' => 'Tài khoản', 'contracts' => 'Hợp đồng', 'customers' => 'Khách hàng',
            'contract_extensions' => 'Gia hạn hợp đồng', 'customer_demands' => 'Nhu cầu', 'categories' => 'Danh mục',
            'brokers' => 'Môi giới', 'broker_assignments' => 'Phân công', 'customer_activities' => 'Lịch chăm sóc',
            'customer_interactions' => 'Tương tác', 'property_types' => 'Loại BĐS'];
        $changes = $log->new_data['changes'] ?? null;
        if (!is_array($changes)) {
            $changes = is_array($log->old_data) && is_array($log->new_data)
                ? app(\App\Services\AuditChanges::class)->changes($log->table_name, $log->old_data, $log->new_data) : [];
        }
        $details = $log->new_data['description'] ?? null;
        // Existing log payloads may contain private fields. Only present safe descriptions.
        if (!is_string($details)) $details = ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id;
        if ($changes && !isset($log->new_data['changes'])) $details = ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id.': '.app(\App\Services\AuditChanges::class)->describe($changes);
        $roles = [1 => 'Admin', 2 => 'Môi giới', 3 => 'Chủ sở hữu', 4 => 'Nhân viên', 5 => 'Khách hàng'];
        $name = $log->user ? $log->user->name.' ('.($roles[(int) $log->user->role_id] ?? 'Người dùng').')' : 'Hệ thống';
        return ['id' => $log->id, 'created_at' => $log->created_at, 'user' => $name,
            'action' => $labels[$log->action] ?? 'Thao tác hệ thống', 'details' => $details, 'changes' => $changes,
            'subject' => ($tables[$log->table_name] ?? 'Bản ghi').' #'.$log->record_id,
            'destination' => app(\App\Services\ActivityDestination::class)->record($viewer, $log->table_name, (int) $log->record_id, $log->action)];
    }

    private function page($paginator, $transform): array
    {
        return ['data' => $paginator->getCollection()->map($transform)->values(), 'meta' => [
            'total' => $paginator->total(), 'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(), 'to' => $paginator->lastItem(),
        ]];
    }

    public function index(Request $request, NotificationInbox $inbox)
    {
        $user = $this->user($request);
        $request->validate(['notification_page' => 'nullable|integer|min:1', 'log_page' => 'nullable|integer|min:1']);
        $inbox->synchronize($user);
        return response()->json([
            'notifications' => $this->page($user->notifications()->orderByDesc('id')->paginate(10, ['*'], 'notification_page'), fn ($row) => $this->notification($row, $user)),
            'logs' => $this->page($this->logs($user)->orderByDesc('id')->paginate(10, ['*'], 'log_page'), fn ($row) => $this->log($row, $user)),
            'unread_count' => $user->unreadNotifications()->count(), 'log_scope' => (int) $user->role_id === 1 ? 'system' : 'personal',
        ]);
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
        return response()->json(['message' => 'Đã đánh dấu tất cả thông báo là đã đọc.', 'updated' => $count, 'unread_count' => $user->unreadNotifications()->count()]);
    }

    public function downloadLogs(Request $request)
    {
        $user = $this->user($request);
        $maximumId = (clone $this->logs($user))->max('id') ?? 0;
        return response()->streamDownload(function () use ($user, $maximumId) {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['Ngày', 'Người dùng', 'Hoạt động', 'Chi tiết'], ',', '"', '');
            $this->logs($user)->where('id', '<=', $maximumId)->chunkById(200, function ($rows) use ($stream, $user) {
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
