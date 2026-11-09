<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContractDocumentFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('page')) {
            $page = $this->query('page');
            if (!is_numeric($page) || intval($page) <= 0 || (string) intval($page) !== (string) $page) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                    'success' => false,
                    'message' => __('spec_messages.row_10_invalid_url_param'),
                ], 404));
            }
        }
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
