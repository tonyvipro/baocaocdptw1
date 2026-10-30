<?php

namespace App\Policies;

use App\Models\ContractDeposit;
use App\Models\User;

class ContractDepositPolicy
{
    public function isAdmin(User $user): bool
    {
        return (int) $user->role_id === 1;
    }

    public function isBroker(User $user): bool
    {
        return (int) $user->role_id === 2;
    }

    public function isStaff(User $user): bool
    {
        return (int) $user->role_id === 4;
    }

    public function isCustomer(User $user): bool
    {
        return in_array((int) $user->role_id, [3, 5], true);
    }

    /**
     * Xem danh sách quản lý tiền cọc (Admin, Môi giới, Staff)
     */
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user) || $this->isBroker($user) || $this->isStaff($user);
    }

    /**
     * Xem chi tiết khoản cọc
     */
    public function view(User $user, ContractDeposit $deposit): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        $contract = $deposit->contract;
        if (!$contract) {
            return false;
        }

        if ($this->isBroker($user)) {
            return (int) $contract->broker_id === (int) $user->id;
        }

        if ($this->isCustomer($user)) {
            return (int) $contract->customer_id === (int) $user->id && (int) $contract->status !== 0;
        }

        return false;
    }

    /**
     * Ghi nhận thu tiền cọc (Admin, Staff, Môi giới phụ trách HĐ)
     */
    public function collect(User $user, ContractDeposit $deposit): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            $contract = $deposit->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Hoàn trả / Khấu trừ tiền cọc (Mặc định chỉ Admin, hoặc Môi giới nếu config cho phép)
     */
    public function refund(User $user, ContractDeposit $deposit): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($this->isBroker($user) && config('deposit.broker_can_refund', false)) {
            $contract = $deposit->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Chỉnh sửa thông tin tiền cọc
     */
    public function update(User $user, ContractDeposit $deposit): bool
    {
        if ($this->isAdmin($user) || $this->isStaff($user)) {
            return true;
        }

        if ($this->isBroker($user)) {
            $contract = $deposit->contract;
            return $contract && (int) $contract->broker_id === (int) $user->id;
        }

        return false;
    }

    /**
     * Hủy (void) giao dịch hoàn/khấu trừ cọc (Chỉ Admin)
     */
    public function voidMovement(User $user): bool
    {
        return $this->isAdmin($user);
    }
}

