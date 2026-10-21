<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectContractExtensionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reject_reason' => 'required|string|min:3|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'reject_reason.required' => 'Vui lòng cung cấp lý do từ chối yêu cầu gia hạn.',
            'reject_reason.min' => 'Lý do từ chối phải có ít nhất 3 ký tự.',
            'reject_reason.max' => 'Lý do từ chối không được vượt quá 1000 ký tự.',
        ];
    }
}
