<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\Contract;
use App\Models\User;

class InvoicePolicy
{
    protected function isAdmin(User $user): bool
    {
        return (int) $user->role_id === 1;
    }

    protected function isBroker(User $user): bool
    {
        return (int) $user->role_id === 2;
    }

    protected function isStaff(User $user): bool
    {
        return (int) $user->role_id === 4;
    }

    protected function isCustomer(User $user): bool
    {
        return (int) $user->role_id === 5;
    }

    /**
     * Nhân viên (Admin, Môi giới, Staff) xem danh sách hóa đơn quản lý
     */
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user) || $this->isBroker($user) || $this->isStaff($user);
    }

    /**
     * Xem chi tiết hóa đơn
     */
    public function view(User $user, Invoice $invoice): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        $contract = $invoice->contract;
        if (!$contract) {
            return false;
        }

        // Môi giới: chỉ xem hóa đơn hợp đồng mình phụ trách
        if ($this->isBroker($user)) {
            return (int) $contract->broker_id === (int) $user->id;
        }

        // Khách hàng: chỉ xem hóa đơn của chính mình, hợp đồng không phải nháp, hóa đơn chưa bị hủy
        if ($this->isCustomer($user)) {
            if ((int) $contract->customer_id !== (int) $user->id) {
                return false;
            }
            if ((int) $contract->status === 0) {
                return false; // Hợp đồng nháp
            }
            if ((int) $invoice->status === 3) {
                return false; // Hóa đơn đã hủy
            }
            return true;
        }

        return false;
    }

    /**
     * Lập hóa đơn thủ công
     */
    public function create(User $user, ?Contract $contract = null): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            if ($contract) {
                return (int) $contract->broker_id === (int) $user->id;
            }
            return true;
        }

        return false;
    }

    /**
     * Chỉnh sửa hóa đơn
     */
    public function update(User $user, Invoice $invoice): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            $contract = $invoice->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Hủy hóa đơn
     */
    public function cancel(User $user, Invoice $invoice): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            $contract = $invoice->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Gửi hóa đơn qua email
     */
    public function sendEmail(User $user, Invoice $invoice): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            $contract = $invoice->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Tải xuống PDF hóa đơn
     */
    public function downloadPdf(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice);
    }
}
