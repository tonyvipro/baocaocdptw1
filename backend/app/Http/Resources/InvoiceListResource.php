<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contract = $this->contract;
        $property = $contract?->property;
        $customer = $contract?->customer;

        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'contract_id' => $this->contract_id,
            'contract_code' => $contract?->contract_code,
            'contract_name' => $contract?->contract_name,
            'property_code' => $property?->code ?? ($property ? 'P' . $property->id : null),
            'property_title' => $property?->title ?? $property?->address,
            'customer_name' => $customer?->name ?? 'N/A',
            'customer_phone' => $customer?->phone,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'title' => $this->title,
            'amount' => (float) $this->amount,
            'paid_amount' => (float) $this->paid_amount,
            'remaining' => (float) $this->remaining,
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => (int) $this->status,
            'status_label' => $this->status_label,
            'billing_period_start' => $this->billing_period_start?->format('Y-m-d'),
            'billing_period_end' => $this->billing_period_end?->format('Y-m-d'),
            'email_sent_at' => $this->email_sent_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
