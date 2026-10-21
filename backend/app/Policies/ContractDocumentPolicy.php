<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\User;

class ContractDocumentPolicy
{
    protected function isAdmin(User $user): bool
    {
        return (int)$user->role_id === 1;
    }

    protected function isBroker(User $user): bool
    {
        return (int)$user->role_id === 2;
    }

    protected function isStaff(User $user): bool
    {
        return (int)$user->role_id === 4;
    }

    protected function isCustomer(User $user): bool
    {
        return (int)$user->role_id === 5;
    }

    /**
     * Nhân viên xem danh sách quản lý tài liệu
     */
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user) || $this->isBroker($user) || $this->isStaff($user);
    }

    /**
     * Xem chi tiết / metadata tài liệu
     */
    public function view(User $user, ContractDocument $document): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $contract = $document->contract;
        if (!$contract) {
            return false;
        }

        // Môi giới: chỉ xem tài liệu hợp đồng mình phụ trách hoặc do chính mình tải lên
        if ($this->isBroker($user)) {
            return (int)$contract->broker_id === (int)$user->id || (int)$document->uploaded_by === (int)$user->id;
        }

        if ($this->isStaff($user)) {
            return true;
        }

        // Khách hàng: chỉ xem tài liệu của hợp đồng của chính mình, loại {0, 1, 4}, và hợp đồng không ở trạng thái Nháp (0)
        if ($this->isCustomer($user)) {
            $isOwnContract = (int)$contract->customer_id === (int)$user->id;
            $isAllowedType = in_array((int)$document->document_type, ContractDocument::CUSTOMER_ALLOWED_TYPES);
            $isPublishedContract = (int)$contract->status !== 0;

            return $isOwnContract && $isAllowedType && $isPublishedContract;
        }

        return false;
    }

    /**
     * Tải lên tài liệu mới cho hợp đồng
     */
    public function upload(User $user, Contract $contract): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        // Khách hàng tuyệt đối không được tải lên
        if ($this->isCustomer($user)) {
            return false;
        }

        if ($this->isBroker($user)) {
            // Chỉ môi giới phụ trách hợp đồng mới được tải lên
            if ((int)$contract->broker_id !== (int)$user->id) {
                return false;
            }

            // Hợp đồng đã hết hạn (2) hoặc hủy (3): chỉ admin được tải lên thêm (Spec mục 3.6)
            if (in_array((int)$contract->status, [2, 3])) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Chỉnh sửa thông tin tài liệu
     */
    public function update(User $user, ContractDocument $document): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($this->isCustomer($user)) {
            return false;
        }

        $contract = $document->contract;
        if (!$contract) {
            return false;
        }

        if ($this->isBroker($user)) {
            if ((int)$contract->broker_id !== (int)$user->id) {
                return false;
            }

            // HĐ hết hạn hoặc hủy: chỉ admin được sửa
            if (in_array((int)$contract->status, [2, 3])) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Xóa mềm tài liệu
     */
    public function delete(User $user, ContractDocument $document): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($this->isCustomer($user)) {
            return false;
        }

        $contract = $document->contract;
        if (!$contract) {
            return false;
        }

        if ($this->isBroker($user)) {
            if ((int)$contract->broker_id !== (int)$user->id) {
                return false;
            }

            // HĐ hết hạn hoặc hủy: chỉ admin được xóa
            if (in_array((int)$contract->status, [2, 3])) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Tải xuống tài liệu hợp đồng
     */
    public function download(User $user, ContractDocument $document): bool
    {
        return $this->view($user, $document);
    }
}
