<?php

namespace App\Enums;

enum Role: int
{
    case Admin = 1;
    case Broker = 2;
    case Owner = 3;
    case Staff = 4;
    case Customer = 5;

    public function databaseName(): string
    {
        return $this === self::Broker ? 'BĐS' : $this->name;
    }

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin (Quản trị viên)',
            self::Broker => 'Broker (Môi giới)',
            self::Owner => 'Owner (Chủ sở hữu)',
            self::Staff => 'Staff (Nhân viên)',
            self::Customer => 'Customer (Khách hàng / Người thuê)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Admin => 'Quản trị tài khoản, phân quyền, danh mục, môi giới, CRM và báo cáo hệ thống.',
            self::Broker => 'Quản lý khách hàng, nhu cầu và lịch chăm sóc được phân công.',
            self::Owner => 'Tài khoản chủ sở hữu; không có quyền quản trị tài khoản hoặc xem báo cáo toàn hệ thống.',
            self::Staff => 'Tài khoản nhân viên; quyền ở từng module do cấu hình và Policy của module đó kiểm soát.',
            self::Customer => 'Tài khoản khách hàng / người thuê, quản lý hồ sơ và thông báo cá nhân.',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
