<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\ContractExtension;
use App\Models\User;

class ContractExtensionPolicy
{
    /**
     * Khách hàng (Role 5) tuyệt đối không có quyền gọi bất kỳ API gia hạn nào
     */
    protected function isStaffOrAdmin(User $user): bool
    {
        return in_array((int)$user->role_id, [1, 2, 4]); // 1: Admin, 2: Môi giới, 4: Nhân viên
    }

    protected function isAdmin(User $user): bool
    {
        return (int)$user->role_id === 1;
    }

    /**
     * Xem danh sách / lịch sử gia hạn
     */
    public function viewAny(User $user): bool
    {
        return $this->isStaffOrAdmin($user);
    }

    public function view(User $user, ContractExtension $extension): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if (!$this->isStaffOrAdmin($user)) {
            return false;
        }

        // Môi giới chỉ xem được hợp đồng mình phụ trách hoặc yêu cầu do chính mình tạo
        $contractBrokerId = (int)($extension->contract->broker_id ?? 0);
        return $contractBrokerId === (int)$user->id || (int)$extension->created_by === (int)$user->id;
    }

    /**
     * Tạo bản nháp gia hạn cho hợp đồng
     */
    public function create(User $user, Contract $contract): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ((int)$user->role_id !== 2) {
            return false;
        }

        // Môi giới chỉ tạo được cho hợp đồng mình phụ trách
        return (int)$contract->broker_id === (int)$user->id;
    }

    /**
     * Cập nhật bản nháp gia hạn (chỉ khi status = 0)
     */
    public function update(User $user, ContractExtension $extension): bool
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return (int)$extension->created_by === (int)$user->id
            || (int)($extension->contract->broker_id ?? 0) === (int)$user->id;
    }

    /**
     * Gửi yêu cầu gia hạn lên cấp trên duyệt (status: 0 -> 1)
     */
    public function submit(User $user, ContractExtension $extension): bool
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return (int)$extension->created_by === (int)$user->id
            || (int)($extension->contract->broker_id ?? 0) === (int)$user->id;
    }

    /**
     * Phê duyệt yêu cầu gia hạn (status: 1 -> 2)
     * Quy tắc: Người gửi yêu cầu không được tự duyệt yêu cầu của chính mình (trừ khi là Admin)
     */
    public function approve(User $user, ContractExtension $extension): bool
    {
        // Chỉ Admin/Quản lý mới có quyền phê duyệt
        return $this->isAdmin($user);
    }

    /**
     * Từ chối yêu cầu gia hạn (status: 1 -> 3)
     */
    public function reject(User $user, ContractExtension $extension): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Hủy/rút lại yêu cầu gia hạn (status -> 4)
     * Được hủy khi đang là Nháp (0) hoặc Chờ duyệt (1)
     */
    public function cancel(User $user, ContractExtension $extension): bool
    {
        if (!in_array((int)$extension->status, [ContractExtension::STATUS_DRAFT, ContractExtension::STATUS_PENDING])) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return (int)$extension->created_by === (int)$user->id;
    }

    /**
     * Xóa bản nháp (chỉ khi status = 0)
     */
    public function delete(User $user, ContractExtension $extension): bool
    {
        if ((int)$extension->status !== ContractExtension::STATUS_DRAFT) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return (int)$extension->created_by === (int)$user->id;
    }

    /**
     * Tải lên tài liệu phụ lục đính kèm
     */
    public function uploadDocument(User $user, ContractExtension $extension): bool
    {
        if (!in_array((int)$extension->status, [ContractExtension::STATUS_DRAFT, ContractExtension::STATUS_PENDING])) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return (int)$extension->created_by === (int)$user->id
            || (int)($extension->contract->broker_id ?? 0) === (int)$user->id;
    }
}
