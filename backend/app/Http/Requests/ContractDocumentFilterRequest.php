<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContractDocumentFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:255',
            'contract_type' => 'nullable|string|max:100',
            'status' => 'nullable|integer|in:0,1,2,3',
            'created_from' => 'nullable|date',
            'created_to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ];
    }
}
