<?php

namespace App\Http\Requests\Deposit;

use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDepositRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $notesMax = (int) config('field_limits.deposit.notes.max', 1000);

        return [
            'version' => ['required', 'integer', 'min:1'],
            'required_amount' => ['nullable', 'numeric', 'gt:0', 'max:999999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'refund_due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', "max:{$notesMax}"],
        ];
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Thiếu thông tin phiên bản tiền cọc (version).',
            'required_amount.numeric' => 'Số tiền cọc cam kết phải là số.',
            'required_amount.gt' => __('spec_messages.row_20_amount_positive'),
            'required_amount.max' => 'Số tiền cọc cam kết vượt quá giới hạn cho phép.',
            'required_amount.regex' => 'Số tiền cọc cam kết chỉ được có tối đa 2 chữ số thập phân.',
            'refund_due_date.date' => 'Hạn hoàn trả dự kiến không đúng định dạng ngày.',
            'notes.max' => 'Ghi chú không được vượt quá 1000 ký tự.',
        ];
    }
}

