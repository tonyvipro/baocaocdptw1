<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Services\AuditChanges;
use Illuminate\Database\Eloquent\Model;

class ManagementAuditObserver
{
    public function created(Model $model): void { $this->record($model, 'CREATE', []); }
    public function updated(Model $model): void { $this->record($model, 'UPDATE', $model->getOriginal()); }
    public function deleted(Model $model): void { $this->record($model, 'DELETE', $model->getOriginal()); }

    private function record(Model $model, string $action, array $before): void
    {
        $request = request();
        if (!$request->attributes->get('audit.enabled') || !$request->is('api/*') || !in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) return;
        if ($request->is('api/login', 'api/logout', 'api/register')) return;
        $actor = $request->attributes->get('audit.actor') ?? $request->user('sanctum') ?? $request->user();
        if (!$actor || !$actor->is_active) return;
        $table = $model->getTable();
        $formatter = app(AuditChanges::class);
        $changes = $action === 'DELETE' ? [] : $formatter->changes($table, $before, $model->getAttributes());
        $directEdit = preg_match('~^api/(?:customers|demands|users|categories|brokers|broker-assignments)/\d+(?:/(?:assign-role|status|cancel))?$|^api/(?:profile|change-password)$~', $request->path());
        if ($action === 'UPDATE' && !$changes && !$directEdit) return;
        $prefix = match ($table) { 'customers' => 'CUSTOMER_', 'customer_demands' => 'DEMAND_', default => '' };
        $logAction = $request->is('api/profile') ? 'PROFILE_UPDATE' : $prefix.$action;
        $label = match ($table) { 'users' => 'Tài khoản', 'categories' => 'Danh mục', 'brokers' => 'Môi giới',
            'broker_assignments' => 'Phân công', 'customers' => 'Khách hàng', 'customer_demands' => 'Nhu cầu',
            'property_types' => 'Loại BĐS', 'customer_activities' => 'Lịch chăm sóc', 'customer_interactions' => 'Tương tác', default => 'Bản ghi' };
        $name = $model->getAttribute('name') ?? $model->getAttribute('title') ?? $model->getAttribute('request_code');
        $summary = $label.($name ? ' “'.$name.'”' : '').' (#'.$model->getKey().'): ';
        $summary .= $action === 'DELETE' ? 'Đã xóa bản ghi.' : ($changes ? $formatter->describe($changes) : 'Đã lưu; không có trường thông tin thay đổi.');
        $log = ActivityLog::create(['user_id' => $actor->id, 'action' => $logAction, 'table_name' => $table, 'record_id' => $model->getKey(),
            'new_data' => ['description' => $summary, 'changes' => $changes], 'ip_address' => $request->ip()]);
        $logs = $request->attributes->get('audit.logs', []);
        $logs[$table.':'.$model->getKey()] = $log->id;
        $request->attributes->set('audit.logs', $logs);
    }
}
