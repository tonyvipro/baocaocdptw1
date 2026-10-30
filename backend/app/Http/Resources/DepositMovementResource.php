<?php

namespace App\Http\Resources;

use App\Enums\TransactionType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepositMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->type ?: TransactionType::PAYMENT;
        $isOutflow = in_array($type, [TransactionType::DEPOSIT_REFUND, TransactionType::DEPOSIT_DEDUCTION], true);

        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'transaction_code' => $this->transaction_code,
            'type' => $type,
            'type_label' => TransactionType::label($type),
            'direction' => $isOutflow ? 'out' : 'in',
            'amount' => round((float) $this->amount, 2),
            'signed_amount' => $isOutflow ? -round((float) $this->amount, 2) : round((float) $this->amount, 2),
            'source' => $this->source,
            'source_label' => $this->source_label,
            'status' => (int) $this->status,
            'status_label' => $this->status_label,
            'payment_method' => $this->payment_method,
            'payment_method_label' => $this->payment_method_label,
            'reference_code' => $this->reference_code,
            'paid_at' => $this->paid_at ? $this->paid_at->toIso8601String() : null,
            'note' => $this->note,
            'reason' => $this->reason,
            'failure_reason' => $this->failure_reason,
            'recorded_by' => $this->recorded_by,
            'recorder' => $this->whenLoaded('recorder', fn () => $this->recorder ? [
                'id' => $this->recorder->id,
                'name' => $this->recorder->name,
                'email' => $this->recorder->email,
            ] : null),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}

