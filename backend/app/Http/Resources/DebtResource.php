<?php

namespace App\Http\Resources;

use App\Enums\InvoiceType;
use App\Queries\DebtQuery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DebtResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $displayStatus = $this->calculated_display_status ?? 'unpaid';

        $statusLabels = [
            'paid' => 'Đã thanh toán',
            'partial' => 'Trả một phần',
            'overdue' => 'Quá hạn',
            'unpaid' => 'Chưa đến hạn',
            'cancelled' => 'Đã hủy',
        ];

        $property = $this->contract?->property;
        $customer = $this->contract?->customer;
        $broker = $this->contract?->broker;

        $amount = (float) $this->amount;
        $paid = (float) ($this->paid_amount ?? 0);
        $remaining = max(0.0, round($amount - $paid, 2));

        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'title' => $this->title,
            'type' => $this->type,
            'type_label' => InvoiceType::label($this->type ?? ''),
            'amount' => $amount,
            'paid_amount' => $paid,
            'remaining_amount' => $remaining,
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'billing_period_start' => $this->billing_period_start,
            'billing_period_end' => $this->billing_period_end,
            'status' => $this->status,
            'version' => $this->version ?? 1,
            'display_status' => $displayStatus,
            'display_status_label' => $statusLabels[$displayStatus] ?? 'Chưa xác định',
            'has_pending_qr' => (bool) ($this->has_pending_qr ?? false),
            'contract' => $this->contract ? [
                'id' => $this->contract->id,
                'contract_code' => $this->contract->contract_code,
                'contract_name' => $this->contract->contract_name,
                'start_date' => $this->contract->start_date?->toDateString(),
                'end_date' => $this->contract->end_date?->toDateString(),
                'status' => $this->contract->status,
            ] : null,
            'property' => $property ? [
                'id' => $property->id,
                'code' => $property->code,
                'title' => $property->title,
                'address' => $property->address,
                'status' => $property->status,
                'closed_reason' => $property->closed_reason,
            ] : null,
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ] : null,
            'broker' => $broker ? [
                'id' => $broker->id,
                'name' => $broker->name,
                'phone' => $broker->phone,
            ] : null,
            'items_count' => $this->relationLoaded('items') ? $this->items->count() : null,
        ];
    }
}
