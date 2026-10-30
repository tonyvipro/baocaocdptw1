<?php

namespace App\Http\Requests\Deposit;

use App\Enums\PaymentMethod;
use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class CollectDepositRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedMethods = implode(',', PaymentMethod::all());
        $noteMax = (int) config('field_limits.payment.note.max', 500);
        $refMax = (int) config('field_limits.payment.reference_code.max', 100);

        return [
            'version' => ['nullable', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'payment_method' => ['required', 'string', "in:{$allowedMethods}"],
            'paid_at' => ['nullable', 'date'],
            'reference_code' => ['nullable', 'string', "max:{$refMax}", 'regex:/^[a-zA-Z0-9_\-\/\.\s]+$/'],
            'note' => ['nullable', 'string', "max:{$noteMax}"],
            'client_token' => ['required', 'string', 'max:36'],
            'confirm_duplicate' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Vui lòng nhập số tiền thu cọc.',
            'amount.numeric' => 'Số tiền thu cọc phải là số.',
            'amount.gt' => __('spec_messages.row_20_amount_positive'),
            'amount.max' => 'Số tiền thu cọc vượt quá giới hạn tối đa cho phép.',
            'amount.regex' => 'Số tiền thu cọc chỉ được có tối đa 2 chữ số thập phân.',
            'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.',
            'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',
            'paid_at.date' => 'Thời gian thu cọc không đúng định dạng.',
            'reference_code.max' => 'Mã tham chiếu không được vượt quá 100 ký tự.',
            'reference_code.regex' => 'Mã tham chiếu chỉ được chứa chữ cái, số, khoảng trắng và các ký tự - _ / .',
            'note.max' => 'Ghi chú không được vượt quá 500 ký tự.',
            'client_token.required' => 'Thiếu mã định danh chống gửi trùng (client_token).',
        ];
    }
}

