<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendInvoiceEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $invoiceParam = $this->route('invoice') ?? $this->route('id');
        if (!$invoiceParam instanceof \App\Models\Invoice) {
            if (!is_numeric($invoiceParam) || intval($invoiceParam) <= 0 || !\App\Models\Invoice::where('id', (int) $invoiceParam)->exists()) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                    'message' => __('spec_messages.row_3_not_found'),
                ], 404));
            }
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.max' => 'Địa chỉ email không được vượt quá 255 ký tự.',
        ];
    }
}
