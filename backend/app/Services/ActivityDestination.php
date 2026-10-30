<?php

namespace App\Services;

use App\Models\Property;
use App\Models\User;

final class ActivityDestination
{
    public function record(User $viewer, string $table, int $id, string $action = ''): ?array
    {
        if ($id < 1) return null;
        $manager = in_array((int) $viewer->role_id, [1, 2], true);
        if (in_array($table, ['customer_activities', 'customer_interactions'], true)) {
            $customerId = \Illuminate\Support\Facades\DB::table($table)->where('id', $id)->value('customer_id');
            return $manager && $customerId ? ['url' => '#admin/customers?tab=tracking&record='.$customerId, 'label' => 'Xem theo dõi khách hàng'] : null;
        }
        if ($table === 'contract_extensions') {
            $contractId = \Illuminate\Support\Facades\DB::table('contract_extensions')->where('id', $id)->value('contract_id');
            return $contractId ? $this->record($viewer, 'contracts', (int) $contractId)
                : ($manager ? ['url' => '#admin/contracts', 'label' => 'Mở hợp đồng'] : null);
        }
        if ($table === 'users') {
            if ($id === (int) $viewer->id) return ['url' => '?modal=profile', 'label' => 'Xem hồ sơ'];
            return (int) $viewer->role_id === 1 ? ['url' => '#admin/users?record='.$id, 'label' => 'Xem người dùng'] : null;
        }
        if ($table === 'invoices') return ['url' => $manager ? '#admin/invoices/'.$id : '#my-invoices', 'label' => 'Xem hóa đơn'];
        if ($table === 'contracts' && !$manager) return ['url' => '#my-contracts/'.$id, 'label' => 'Xem hợp đồng'];
        if (!$manager) return null;
        $modules = ['properties' => ['properties', 'BĐS'], 'contracts' => ['contracts', 'hợp đồng'],
            'categories' => ['categories', 'danh mục'], 'brokers' => ['brokers', 'môi giới'],
            'broker_assignments' => ['brokers', 'phân công'], 'property_types' => ['property-types', 'loại BĐS'],
            'customers' => ['customers', 'khách hàng'], 'customer_demands' => ['demands', 'nhu cầu'],
            'appointments' => ['appointments', 'lịch hẹn'], 'contract_documents' => ['contract-documents', 'tài liệu']];
        if (!isset($modules[$table])) return null;
        [$module, $label] = $modules[$table];
        if (str_contains($action, 'DELETE')) {
            return ['url' => '#admin/'.$module.($table === 'properties' ? '?tab=trash' : ''), 'label' => 'Mở quản lý '.$label];
        }
        $params = ['record' => $id];
        if ($table === 'broker_assignments') $params['tab'] = 'assignments';
        if ($table === 'properties') {
            $code = Property::withTrashed()->whereKey($id)->value('code');
            if ($code) $params['search'] = $code;
        }
        return ['url' => '#admin/'.$module.'?'.http_build_query($params), 'label' => 'Xem '.$label];
    }

    public function notification(User $viewer, array $data): ?array
    {
        $target = $data['target'] ?? null;
        if (is_array($target) && is_string($target['table'] ?? null) && filter_var($target['id'] ?? null, FILTER_VALIDATE_INT)) {
            return $this->record($viewer, $target['table'], (int) $target['id']);
        }
        foreach (['invoice_id' => 'invoices', 'contract_id' => 'contracts', 'property_id' => 'properties'] as $key => $table) {
            if (filter_var($data[$key] ?? null, FILTER_VALIDATE_INT)) return $this->record($viewer, $table, (int) $data[$key]);
        }
        if (str_contains((string) ($data['category'] ?? ''), 'profile')) return ['url' => '?modal=profile', 'label' => 'Xem hồ sơ'];
        $category = strtolower((string) ($data['category'] ?? ''));
        $manager = in_array((int) $viewer->role_id, [1, 2], true);
        if (str_contains($category, 'payment')) return ['url' => $manager ? '#admin/invoices' : '#my-invoices', 'label' => 'Mở hóa đơn'];
        if (str_contains($category, 'contract')) return ['url' => $manager ? '#admin/contracts' : '#my-contracts', 'label' => 'Mở hợp đồng'];
        if ($manager && str_contains($category, 'appointment')) return ['url' => '#admin/appointments', 'label' => 'Mở lịch hẹn'];
        return null;
    }
}
