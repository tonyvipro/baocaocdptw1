<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\User;
use App\Services\NotificationInbox;
use Closure;
use Illuminate\Http\Request;

class RecordUserActivity
{
    public function handle(Request $request, Closure $next)
    {
        $path = $request->path();
        $actor = $request->bearerToken() ? auth('sanctum')->user() : $request->user();
        $contractId = preg_match('~^api/contracts/(\d+)(?:/status)?$~', $path, $match) ? (int) $match[1] : null;
        $oldStatus = $contractId && in_array($request->method(), ['PUT', 'PATCH']) ? Contract::whereKey($contractId)->value('status') : null;
        $response = $next($request);
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']) || $response->getStatusCode() < 200 || $response->getStatusCode() >= 300) return $response;
        try {
            if (in_array($path, ['api/login', 'api/register'])) $actor = auth()->user();
            if (!$actor || !$actor->is_active) return $response;
            $action = $table = $details = null;
            $recordId = $actor->id;
            $contract = null;
            if ($path === 'api/login') { $action = 'LOGIN'; $table = 'users'; $details = 'Đăng nhập hệ thống'; }
            elseif ($path === 'api/logout') { $action = 'LOGOUT'; $table = 'users'; $details = 'Đăng xuất hệ thống'; }
            elseif ($path === 'api/profile') {
                $action = 'PROFILE_UPDATE'; $table = 'users';
                $labels = ['name' => 'họ tên', 'phone' => 'số điện thoại', 'avatar' => 'ảnh đại diện', 'dark_mode' => 'giao diện'];
                $fields = array_values(array_intersect_key($labels, $request->all()));
                $details = 'Cập nhật '.($fields ? implode(', ', $fields) : 'thông tin hồ sơ');
            } elseif ($path === 'api/contracts' || $contractId) {
                $payload = json_decode($response->getContent(), true);
                $recordId = $contractId ?? ($payload['data']['id'] ?? 0);
                $contract = Contract::find($recordId);
                $table = 'contracts';
                $signed = $contract && (int) $contract->status === 1 && ($oldStatus === null || (int) $oldStatus !== 1);
                $action = $signed ? 'CONTRACT_SIGN' : ($request->isMethod('POST') ? 'CONTRACT_CREATE' : ($request->isMethod('DELETE') ? 'CONTRACT_DELETE' : 'CONTRACT_UPDATE'));
                $details = ($signed ? 'Kích hoạt hợp đồng ' : 'Hợp đồng ').($contract?->contract_code ?? '#'.$recordId);
            } elseif (preg_match('~^api/customers(?:/(\d+))?$~', $path, $matches)) {
                $payload = json_decode($response->getContent(), true);
                $recordId = isset($matches[1]) ? (int) $matches[1] : ($payload['data']['id'] ?? 0);
                $action = $request->isMethod('POST') ? 'CUSTOMER_CREATE' : ($request->isMethod('DELETE') ? 'CUSTOMER_DELETE' : 'CUSTOMER_UPDATE');
                $table = 'customers'; $details = 'Khách hàng #'.$recordId;
            } elseif (preg_match('~^api/demands(?:/(\d+))?$~', $path, $matches)) {
                $payload = json_decode($response->getContent(), true);
                $recordId = isset($matches[1]) ? (int) $matches[1] : ($payload['data']['id'] ?? 0);
                $action = $request->isMethod('POST') ? 'DEMAND_CREATE' : ($request->isMethod('DELETE') ? 'DEMAND_DELETE' : 'DEMAND_UPDATE');
                $table = 'customer_demands'; $details = 'Nhu cầu ND-'.(1000 + (int) $recordId);
            }
            if (!$action) return $response;
            $log = ActivityLog::create(['user_id' => $actor->id, 'action' => $action, 'table_name' => $table, 'record_id' => $recordId,
                'new_data' => ['description' => $details], 'ip_address' => $request->ip()]);
            $inbox = app(NotificationInbox::class);
            if ($action === 'PROFILE_UPDATE') $inbox->publish($actor, 'profile', 'Thông tin hồ sơ của bạn đã được cập nhật.', 'profile:'.$log->id);
            if ($action === 'CONTRACT_SIGN' && $contract) {
                foreach (User::whereIn('id', array_filter([$actor->id, $contract->customer_id, $contract->broker_id]))->where('is_active', true)->get() as $recipient) {
                    $inbox->publish($recipient, 'contract', 'Hợp đồng '.$contract->contract_code.' đã được ký và chuyển sang hiệu lực.', 'contract-sign:'.$log->id);
                }
            }
        } catch (\Throwable $error) { report($error); }
        return $response;
    }
}
