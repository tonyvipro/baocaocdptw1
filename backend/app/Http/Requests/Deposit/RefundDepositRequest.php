<?php

namespace App\Http\Requests\Deposit;

use App\Enums\PaymentMethod;
use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RefundDepositRequest extends FormRequest
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
        $reasonMax = (int) config('field_limits.deposit.reason.max', 500);
        $refMax = (int) config('field_limits.payment.reference_code.max', 100);

        return [
            'version' => ['required', 'integer', 'min:1'],
            'refund_amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'deduction_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'deduction_reason' => ['nullable', 'string', "max:{$reasonMax}"],
            'early_refund_reason' => ['nullable', 'string', "max:{$reasonMax}"],
            'payment_method' => ['required', 'string', "in:{$allowedMethods}"],
            'paid_at' => ['nullable', 'date'],
            'reference_code' => ['nullable', 'string', "max:{$refMax}", 'regex:/^[a-zA-Z0-9_\-\/\.\s]+$/'],
            'note' => ['nullable', 'string', "max:{$noteMax}"],
            'client_token' => ['required', 'string', 'max:36'],
            'confirm_duplicate' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $refund = round((float) ($this->input('refund_amount') ?? 0), 2);
            $deduction = round((float) ($this->input('deduction_amount') ?? 0), 2);

            if ($refund + $deduction <= 0) {
                $v->errors()->add('refund_amount', __('spec_messages.row_20_amount_positive'));
            }

            if ($deduction > 0 && trim((string) $this->input('deduction_reason', '')) === '') {
                $v->errors()->add('deduction_reason', __('spec_messages.deposit_deduction_reason_required'));
            }
        });
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Thiếu thông tin phiên bản tiền cọc (version).',
            'refund_amount.required' => 'Vui lòng nhập số tiền hoàn trả (nhập 0 nếu khấu trừ toàn bộ).',
            'refund_amount.numeric' => 'Số tiền hoàn trả phải là số.',
            'refund_amount.min' => 'Số tiền hoàn trả không được âm.',
            'refund_amount.max' => 'Số tiền hoàn trả vượt quá giới hạn cho phép.',
            'refund_amount.regex' => 'Số tiền hoàn trả chỉ được có tối đa 2 chữ số thập phân.',
            'deduction_amount.numeric' => 'Số tiền khấu trừ phải là số.',
            'deduction_amount.min' => 'Số tiền khấu trừ không được âm.',
            'deduction_amount.max' => 'Số tiền khấu trừ vượt quá giới hạn cho phép.',
            'deduction_amount.regex' => 'Số tiền khấu trừ chỉ được có tối đa 2 chữ số thập phân.',
            'deduction_reason.max' => 'Lý do khấu trừ không được vượt quá 500 ký tự.',
            'early_refund_reason.max' => 'Lý do hoàn trả sớm không được vượt quá 500 ký tự.',
            'payment_method.required' => 'Vui lòng chọn phương thức hoàn trả.',
            'payment_method.in' => 'Phương thức hoàn trả không hợp lệ.',
            'reference_code.max' => 'Mã tham chiếu không được vượt quá 100 ký tự.',
            'reference_code.regex' => 'Mã tham chiếu chỉ được chứa chữ cái, số, khoảng trắng và các ký tự - _ / .',
            'note.max' => 'Ghi chú không được vượt quá 500 ký tự.',
            'client_token.required' => 'Thiếu mã định danh chống gửi trùng (client_token).',
        ];
    }
}

