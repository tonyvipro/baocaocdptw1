<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractExtensionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $contract = $this->relationLoaded('contract') ? $this->contract : null;

        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'extension_type' => $this->extension_type,
            'extension_type_label' => $this->type_label,
            'duration_months' => $this->duration_months,
            'new_start_date' => $this->new_start_date?->format('Y-m-d'),
            'new_end_date' => $this->new_end_date?->format('Y-m-d'),
            'old_end_date' => $this->old_end_date?->format('Y-m-d') ?? ($contract?->end_date?->format('Y-m-d')),
            'new_rental_price' => $this->new_rental_price !== null ? (float)$this->new_rental_price : null,
            'old_rental_price' => $this->old_rental_price !== null ? (float)$this->old_rental_price : ($contract ? (float)$contract->rental_price : null),
            'reason' => $this->reason,
            'note' => $this->note,
            'extension_date' => $this->extension_date?->format('Y-m-d'),
            'created_by' => $this->created_by,
            'creator_name' => $this->creator?->name ?? 'Người lập',
            'approved_by' => $this->approved_by,
            'approver_name' => $this->approver?->name,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'reject_reason' => $this->reject_reason,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            // Hợp đồng liên quan (nếu eager loaded)
            'contract' => $this->whenLoaded('contract', function () use ($contract) {
                return [
                    'id' => $contract->id,
                    'contract_code' => $contract->contract_code,
                    'contract_name' => $contract->contract_name,
                    'status' => $contract->status,
                    'end_date' => $contract->end_date?->format('Y-m-d'),
                    'rental_price' => (float)$contract->rental_price,
                    'customer_name' => $contract->customer?->name ?? 'Khách hàng',
                    'customer_phone' => $contract->customer?->phone ?? 'N/A',
                    'broker_name' => $contract->broker?->name ?? 'Môi giới',
                    'property_title' => $contract->property?->title ?? 'Bất động sản',
                    'property_address' => $contract->property?->address ?? 'N/A',
                ];
            }),

            // Danh sách tài liệu đính kèm
            'documents' => $this->whenLoaded('documents', function () {
                return $this->documents->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'file_url' => $doc->file_url,
                        'original_name' => $doc->original_name,
                        'file_size' => $doc->file_size,
                        'mime_type' => $doc->mime_type,
                        'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
                    ];
                });
            }, []),
        ];
    }
}
