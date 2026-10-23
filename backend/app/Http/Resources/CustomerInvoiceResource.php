<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contract = $this->contract;
        $property = $contract?->property;

        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'title' => $this->title,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'contract_code' => $contract?->contract_code,
            'contract_name' => $contract?->contract_name,
            'property_code' => $property?->code ?? ($property ? 'P' . $property->id : null),
            'property_title' => $property?->title ?? $property?->address,
            'property_address' => $property?->address,
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
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'quantity' => (float) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'description' => $item->description,
                ];
            }),
            'transactions' => $this->transactions->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'amount' => (float) $tx->amount,
                    'payment_method_label' => $tx->payment_method_label,
                    'paid_at' => $tx->paid_at?->format('Y-m-d H:i:s'),
                ];
            }),
        ];
    }
}
