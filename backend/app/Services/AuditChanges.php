<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class AuditChanges
{
    private const FIELDS = [
        'name' => 'Tên', 'title' => 'Tiêu đề', 'email' => 'Email', 'phone' => 'Số điện thoại',
        'role_id' => 'Vai trò', 'is_active' => 'Hoạt động', 'dark_mode' => 'Giao diện tối', 'avatar' => 'Ảnh đại diện',
        'description' => 'Mô tả', 'status' => 'Trạng thái', 'icon' => 'Biểu tượng', 'display_order' => 'Thứ tự hiển thị',
        'code' => 'Mã', 'level' => 'Cấp bậc', 'deals_count' => 'Số giao dịch', 'total_commission' => 'Tổng hoa hồng', 'notes' => 'Ghi chú',
        'request_code' => 'Mã yêu cầu', 'customer_name' => 'Tên khách hàng', 'customer_phone' => 'SĐT khách hàng', 'customer_email' => 'Email khách hàng',
        'property_location' => 'Địa điểm BĐS', 'broker_id' => 'Môi giới', 'assigned_date' => 'Ngày phân công', 'assigned_to' => 'Người phụ trách',
        'company' => 'Công ty', 'source' => 'Nguồn khách', 'customer_group' => 'Nhóm khách', 'is_tracked' => 'Theo dõi',
        'customer_id' => 'Khách hàng', 'property_type_id' => 'Loại BĐS', 'budget_min' => 'Ngân sách từ', 'budget_max' => 'Ngân sách đến', 'area' => 'Khu vực / Diện tích',
        'price' => 'Giá', 'price_sale' => 'Giá bán', 'price_rent' => 'Giá thuê', 'purpose' => 'Mục đích', 'type' => 'Loại', 'project' => 'Dự án',
        'address' => 'Địa chỉ', 'street' => 'Đường', 'district' => 'Quận / Huyện', 'city' => 'Tỉnh / Thành phố', 'image' => 'Ảnh',
        'bedrooms' => 'Phòng ngủ', 'bathrooms' => 'Phòng tắm', 'expire_date' => 'Hạn tin', 'scheduled_at' => 'Lịch chăm sóc', 'completed_at' => 'Hoàn thành lúc',
        'summary' => 'Nội dung tương tác', 'occurred_at' => 'Thời điểm tương tác', 'contract_code' => 'Mã hợp đồng', 'contract_name' => 'Tên hợp đồng',
        'start_date' => 'Ngày bắt đầu', 'end_date' => 'Ngày kết thúc', 'rental_price' => 'Giá thuê', 'deposit_amount' => 'Tiền cọc',
    ];

    public function changes(string $table, array $before, array $after): array
    {
        $changes = [];
        foreach (self::FIELDS as $field => $label) {
            if (!array_key_exists($field, $before) && !array_key_exists($field, $after)) continue;
            $old = $before[$field] ?? null; $new = $after[$field] ?? null;
            if ((string) $old === (string) $new || ($old === null && $new === '')) continue;
            if (in_array($field, ['price', 'price_sale', 'price_rent', 'budget_min', 'budget_max', 'area', 'total_commission', 'rental_price', 'deposit_amount'], true)
                && is_numeric($old) && is_numeric($new) && $this->number($old) === $this->number($new)) continue;
            $changes[] = ['field' => $field, 'label' => $label, 'before' => $this->value($table, $field, $old), 'after' => $this->value($table, $field, $new)];
        }
        if ($table === 'users' && array_key_exists('password', $after) && ($before['password'] ?? null) !== $after['password']) {
            $changes[] = ['field' => 'password', 'label' => 'Mật khẩu', 'before' => 'Đã thiết lập', 'after' => 'Đã thay đổi'];
        }
        return $changes;
    }

    private function number(mixed $value): string
    {
        if (!preg_match('/^(-?)([0-9]+)(?:\.([0-9]+))?$/D', (string) $value, $parts)) return (string) $value;
        $integer = ltrim($parts[2], '0') ?: '0';
        $decimal = rtrim($parts[3] ?? '', '0');
        return ($parts[1] && ($integer !== '0' || $decimal !== '') ? '-' : '').$integer.($decimal !== '' ? '.'.$decimal : '');
    }

    private function value(string $table, string $field, mixed $value): string
    {
        if ($value === null || $value === '') return 'Trống';
        if (in_array($field, ['avatar', 'image'], true)) return 'Có ảnh';
        if (str_contains($field, 'phone')) return '******'.substr((string) $value, -4);
        if (str_contains($field, 'email')) {
            [$local, $domain] = array_pad(explode('@', (string) $value, 2), 2, '');
            return mb_substr($local, 0, 1).'***@'.$domain;
        }
        if (in_array($field, ['is_active', 'is_tracked', 'dark_mode'], true)) return $value ? 'Bật' : 'Tắt';
        $relation = match ($field) { 'role_id' => ['roles', 'name'], 'broker_id' => ['brokers', 'name'],
            'assigned_to' => ['users', 'name'], 'customer_id' => [$table === 'contracts' ? 'users' : 'customers', 'name'],
            'property_type_id' => ['property_types', 'name'], default => null };
        if ($relation) return (DB::table($relation[0])->where('id', $value)->value($relation[1]) ?? 'Bản ghi').' (#'.$value.')';
        if ($field === 'status') {
            $labels = ['active' => 'Hoạt động', 'inactive' => 'Ngừng hoạt động', 'busy' => 'Đang bận', 'pending' => 'Đang chờ',
                'processing' => 'Đang xử lý', 'completed' => 'Hoàn thành', 'cancelled' => 'Đã hủy', 'new' => 'Mới',
                'contacted' => 'Đã liên hệ', 'interested' => 'Quan tâm', 'potential' => 'Tiềm năng', 'closed' => 'Đã chốt'];
            if ($table === 'properties') $labels += [0 => 'Chờ duyệt', 1 => 'Đang hiển thị', 2 => 'Đã giao dịch', 3 => 'Hết hạn', 4 => 'Đã ẩn'];
            if ($table === 'contracts') $labels += [0 => 'Nháp', 1 => 'Hiệu lực', 2 => 'Hết hạn', 3 => 'Đã hủy'];
            return $labels[$value] ?? (string) $value;
        }
        return mb_substr((string) $value, 0, 250);
    }

    public function describe(array $changes): string
    {
        return implode('; ', array_map(fn ($change) => $change['label'].': “'.$change['before'].'” → “'.$change['after'].'”', $changes));
    }
}
