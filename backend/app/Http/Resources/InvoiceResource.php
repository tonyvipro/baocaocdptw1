<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contract = $this->contract;
        $property = $contract?->property;
        $customer = $contract?->customer;
        $broker = $contract?->broker;

        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'contract_id' => $this->contract_id,
            'contract' => $contract ? [
                'id' => $contract->id,
                'contract_code' => $contract->contract_code,
                'contract_name' => $contract->contract_name,
                'status' => $contract->status,
                'rental_price' => (float) $contract->rental_price,
                'deposit_amount' => (float) $contract->deposit_amount,
                'start_date' => $contract->start_date?->format('Y-m-d'),
                'end_date' => $contract->end_date?->format('Y-m-d'),
                'broker_id' => $contract->broker_id,
                'broker_name' => $broker?->name,
            ] : null,
            'property' => $property ? [
                'id' => $property->id,
                'code' => $property->code ?? ('P' . $property->id),
                'title' => $property->title,
                'address' => $property->address,
                'district' => is_string($property->district) ? $property->district : ($property->district?->name ?? null),
                'province' => is_string($property->city) ? $property->city : ($property->province?->name ?? 'TP. Hồ Chí Minh'),
            ] : null,
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
            ] : null,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'title' => $this->title,
            'amount' => (float) $this->amount,
            'paid_amount' => (float) $this->paid_amount,
            'remaining' => (float) $this->remaining,
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'billing_period_start' => $this->billing_period_start?->format('Y-m-d'),
            'billing_period_end' => $this->billing_period_end?->format('Y-m-d'),
            'status' => (int) $this->status,
            'status_label' => $this->status_label,
            'note' => $this->note,
            'cancel_reason' => $this->cancel_reason,
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'email_sent_at' => $this->email_sent_at?->format('Y-m-d H:i:s'),
            'created_by' => $this->created_by,
            'creator_name' => $this->creator?->name,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'quantity' => (float) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'description' => $item->description,
                    'sort_order' => (int) $item->sort_order,
                ];
            }),
            'transactions' => $this->transactions->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'amount' => (float) $tx->amount,
                    'payment_method' => $tx->payment_method,
                    'payment_method_label' => $tx->payment_method_label,
                    'paid_at' => $tx->paid_at?->format('Y-m-d H:i:s'),
                ];
            }),
        ];
    }
}
