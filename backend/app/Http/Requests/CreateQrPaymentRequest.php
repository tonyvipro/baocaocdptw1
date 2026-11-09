<?php

namespace App\Http\Requests;

use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class CreateQrPaymentRequest extends FormRequest
{
    use NormalizesInput;

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
            'gateway' => ['nullable', 'string', 'in:sepay,mock,momo,zalopay'],
            'amount' => ['nullable', 'numeric', 'gt:0', 'max:999999999999.99'],
            'client_token' => ['nullable', 'uuid'],
            'version' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'gateway.in' => 'Cổng thanh toán đã chọn không được hỗ trợ.',
            'amount.numeric' => 'Số tiền thanh toán phải là số.',
            'amount.gt' => 'Số tiền thanh toán phải lớn hơn 0.',
            'client_token.uuid' => 'client_token phải là chuỗi UUID hợp lệ.',
        ];
    }
}
