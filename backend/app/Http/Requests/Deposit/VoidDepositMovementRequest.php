<?php

namespace App\Http\Requests\Deposit;

use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class VoidDepositMovementRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $reasonMax = (int) config('field_limits.deposit.reason.max', 500);

        return [
            'reason' => ['required', 'string', 'min:3', "max:{$reasonMax}"],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Vui lòng nhập lý do hủy giao dịch tiền cọc.',
            'reason.min' => 'Lý do hủy giao dịch phải có ít nhất 3 ký tự.',
            'reason.max' => 'Lý do hủy giao dịch không được vượt quá 500 ký tự.',
        ];
    }
}

