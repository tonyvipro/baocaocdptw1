<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceFilterRequest extends FormRequest
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
                    'message' => __('spec_messages.row_10_invalid_url_param'),
                ], 404));
            }
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:0,1,2,3'],
            'type' => ['nullable', 'string', 'in:rent,deposit,service,other'],
            'contract_id' => ['nullable', 'integer'],
            'due_from' => ['nullable', 'date'],
            'due_to' => ['nullable', 'date', 'after_or_equal:due_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
