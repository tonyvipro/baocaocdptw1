<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendInvoiceEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
