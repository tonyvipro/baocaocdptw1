<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'version' => ['required', 'integer', 'min:1'],
            'cancel_reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Thiếu thông tin phiên bản hóa đơn (version).',
            'version.integer' => 'Phiên bản hóa đơn phải là số nguyên.',
            'cancel_reason.required' => 'Vui lòng nhập lý do hủy hóa đơn.',
            'cancel_reason.min' => 'Lý do hủy hóa đơn phải có ít nhất 3 ký tự.',
            'cancel_reason.max' => 'Lý do hủy không được vượt quá 1000 ký tự.',
        ];
    }
}
