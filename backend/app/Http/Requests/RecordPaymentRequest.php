<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedMethods = implode(',', PaymentMethod::all());

        return [
            'version' => ['required', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999.99', 'regex:/^\d+(\.\d{1,2})?$/'],
            'payment_method' => ['required', 'string', "in:{$allowedMethods}"],
            'paid_at' => ['required', 'date'],
            'reference_code' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_\-\/\.\s]+$/'],
            'note' => ['nullable', 'string', 'max:500'],
            'client_token' => ['required', 'uuid'],
            'confirm_duplicate' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Thiếu thông tin phiên bản hóa đơn (version).',
            'version.integer' => 'Phiên bản hóa đơn phải là số nguyên.',
            'amount.required' => 'Vui lòng nhập số tiền thanh toán.',
            'amount.numeric' => 'Số tiền thanh toán phải là số.',
            'amount.gt' => 'Số tiền thanh toán phải lớn hơn 0.',
            'amount.max' => 'Số tiền thanh toán vượt quá giới hạn tối đa cho phép.',
            'amount.regex' => 'Số tiền thanh toán chỉ được có tối đa 2 chữ số thập phân.',
            'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.',
            'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',
            'paid_at.required' => 'Vui lòng chọn ngày thanh toán.',
            'paid_at.date' => 'Ngày thanh toán không đúng định dạng.',
            'reference_code.max' => 'Mã tham chiếu không được vượt quá 100 ký tự.',
            'reference_code.regex' => 'Mã tham chiếu chỉ được chứa chữ cái, số, khoảng trắng và các ký tự - _ / .',
            'note.max' => 'Ghi chú không được vượt quá 500 ký tự.',
            'client_token.required' => 'Thiếu client_token để xác thực giao dịch.',
            'client_token.uuid' => 'client_token phải là chuỗi UUID hợp lệ.',
        ];
    }
}
