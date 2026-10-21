<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerContractDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'document_type' => (int)$this->document_type,
            'document_type_label' => $this->document_type_label,
            'title' => $this->title ?: $this->original_name,
            'original_name' => $this->original_name,
            'file_size' => (int)$this->file_size,
            'file_size_formatted' => $this->file_size_formatted,
            'mime_type' => $this->mime_type,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
