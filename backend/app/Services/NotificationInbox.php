<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationInbox
{
    public function publish(User $user, string $category, string $message, string $source, $occurredAt = null): void
    {
        $hash = md5($user->getMorphClass().':'.$user->id.':'.$source);
        $hash[12] = '4';
        $hash[16] = 'a';
        $id = substr($hash, 0, 8).'-'.substr($hash, 8, 4).'-'.substr($hash, 12, 4).'-'.substr($hash, 16, 4).'-'.substr($hash, 20, 12);
        DB::table('notifications')->insertOrIgnore([
            'id' => $id, 'type' => 'system.'.$category, 'notifiable_type' => $user->getMorphClass(), 'notifiable_id' => $user->id,
            'data' => json_encode(['category' => $category, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'read_at' => null, 'created_at' => $occurredAt ?? now(), 'updated_at' => now(),
        ]);
    }

    public function synchronize(User $user): void
    {
        $admin = (int) $user->role_id === 1;
        $invoices = DB::table('invoices')->join('contracts', 'contracts.id', '=', 'invoices.contract_id')
            ->whereNull('contracts.deleted_at')
            ->when(!$admin, fn ($query) => $query->where(fn ($q) => $q->where('contracts.customer_id', $user->id)->orWhere('contracts.broker_id', $user->id)))
            ->where(fn ($q) => $q->where('invoices.status', 1)->orWhere(fn ($pending) => $pending->where('invoices.status', 0)->where('invoices.due_date', '<', now('Asia/Ho_Chi_Minh')->toDateString())))
            ->orderBy('invoices.id')
            ->select(['invoices.id', 'invoices.title', 'invoices.status', 'invoices.due_date', 'invoices.updated_at', 'contracts.contract_code'])->cursor();
        foreach ($invoices as $invoice) {
            if ((int) $invoice->status === 1) {
                $this->publish($user, 'payment', 'Thanh toán '.$invoice->title.' ('.$invoice->contract_code.') đã được xác nhận.', 'invoice-paid:'.$invoice->id, $invoice->updated_at);
            } else {
                $this->publish($user, 'warning', 'Hóa đơn '.$invoice->title.' ('.$invoice->contract_code.') đã quá hạn thanh toán ngày '.$invoice->due_date.'.', 'invoice-overdue:'.$invoice->id.':'.$invoice->due_date);
            }
        }
        $today = now('Asia/Ho_Chi_Minh')->toDateString();
        $soon = now('Asia/Ho_Chi_Minh')->addDays(3)->toDateString();
        $contracts = DB::table('contracts')->whereNull('deleted_at')->where('status', 1)
            ->whereDate('end_date', '>=', $today)->whereDate('end_date', '<=', $soon)
            ->when(!$admin, fn ($query) => $query->where(fn ($q) => $q->where('customer_id', $user->id)->orWhere('broker_id', $user->id)))
            ->orderBy('end_date')->get(['id', 'contract_code', 'end_date']);
        foreach ($contracts as $contract) {
            $this->publish($user, 'warning', 'Hợp đồng '.$contract->contract_code.' sắp hết hạn ngày '.$contract->end_date.'.', 'contract-expiring:'.$contract->id.':'.$contract->end_date);
        }
    }
}
