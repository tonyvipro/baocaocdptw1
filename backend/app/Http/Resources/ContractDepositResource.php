<?php

namespace App\Http\Resources;

use App\Queries\DepositQuery;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractDepositResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $metrics = DepositQuery::computeMetrics($this->resource);
        $contract = $this->whenLoaded('contract', fn () => $this->contract);
        $property = $contract && $contract->relationLoaded('property') ? $contract->property : null;
        $customer = $contract && $contract->relationLoaded('customer') ? $contract->customer : null;
        $broker = $contract && $contract->relationLoaded('broker') ? $contract->broker : null;
        $invoice = $this->whenLoaded('invoice', fn () => $this->invoice);

        $collectionDate = $this->collection_date
            ? Carbon::parse($this->collection_date)->toIso8601String()
            : null;

        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'invoice_id' => $this->invoice_id,
            'required_amount' => $metrics['required_amount'],
            'collected_amount' => $metrics['collected_amount'],
            'refunded_amount' => $metrics['refunded_amount'],
            'deducted_amount' => $metrics['deducted_amount'],
            'held_amount' => $metrics['held_amount'],
            'remaining_to_collect' => $metrics['remaining_to_collect'],
            'is_refund_due' => $metrics['is_refund_due'],
            'display_status' => $metrics['display_status'],
            'display_status_label' => $metrics['display_status_label'],
            'display_status_color' => $metrics['display_status_color'],
            'collection_date' => $collectionDate,
            'refund_due_date' => $this->refund_due_date ? $this->refund_due_date->toDateString() : ($contract?->end_date ? $contract->end_date->toDateString() : null),
            'contract_end_date' => $contract?->end_date ? $contract->end_date->toDateString() : ($this->contract_end_date ? Carbon::parse($this->contract_end_date)->toDateString() : null),
            'notes' => $this->notes,
            'version' => (int) ($this->version ?? 1),
            'has_pending_qr' => (bool) ($this->has_pending_qr ?? false),
            'documents_count' => (int) ($this->documents_count ?? 0),

            'contract' => $contract ? [
                'id' => $contract->id,
                'contract_code' => $contract->contract_code,
                'contract_name' => $contract->contract_name,
                'status' => (int) $contract->status,
                'start_date' => $contract->start_date ? $contract->start_date->toDateString() : null,
                'end_date' => $contract->end_date ? $contract->end_date->toDateString() : null,
                'rental_price' => (float) ($contract->rental_price ?? 0),
                'deposit_amount' => (float) ($contract->deposit_amount ?? 0),
            ] : null,

            'property' => $property ? [
                'id' => $property->id,
                'code' => $property->code,
                'title' => $property->title,
                'address' => $property->address,
                'purpose' => $property->purpose,
                'status' => (int) $property->status,
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
                'email' => $broker->email,
            ] : null,

            'invoice' => $invoice ? [
                'id' => $invoice->id,
                'invoice_no' => $invoice->invoice_no,
                'amount' => (float) $invoice->amount,
                'paid_amount' => (float) $invoice->paid_amount,
                'remaining' => (float) $invoice->remaining,
                'status' => (int) $invoice->status,
                'status_label' => $invoice->status_label,
                'due_date' => $invoice->due_date ? $invoice->due_date->toDateString() : null,
                'version' => (int) ($invoice->version ?? 1),
            ] : null,

            'movements' => $invoice && $invoice->relationLoaded('transactions')
                ? DepositMovementResource::collection($invoice->transactions)
                : $this->when(false, []),

            'documents' => $contract && $contract->relationLoaded('documents')
                ? $contract->documents->map(fn ($doc) => [
                    'id' => $doc->id,
                    'contract_id' => $doc->contract_id,
                    'document_type' => (int) $doc->document_type,
                    'document_type_label' => $doc->document_type_label,
                    'title' => $doc->title,
                    'original_name' => $doc->original_name,
                    'file_size' => (int) $doc->file_size,
                    'file_size_formatted' => $doc->file_size_formatted,
                    'mime_type' => $doc->mime_type,
                    'description' => $doc->description,
                    'uploaded_by' => $doc->uploaded_by,
                    'uploader_name' => $doc->uploader?->name,
                    'created_at' => $doc->created_at ? $doc->created_at->toIso8601String() : null,
                ])->values()
                : $this->when(false, []),

            'updated_by' => $this->updated_by,
            'updater_name' => $this->whenLoaded('updater', fn () => $this->updater?->name),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}

