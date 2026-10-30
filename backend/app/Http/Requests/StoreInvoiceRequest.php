<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\InvoiceType;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id' => ['required', 'integer', 'exists:contracts,id'],
            'type' => ['required', 'string', 'in:' . implode(',', InvoiceType::all())],
            'title' => ['required', 'string', 'max:255'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
            'billing_period_start' => ['nullable', 'date'],
            'billing_period_end' => ['nullable', 'date', 'after_or_equal:billing_period_start'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'gte:0'],
            'items.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'contract_id.required' => 'Vui lòng chọn hợp đồng cho hóa đơn.',
            'contract_id.exists' => 'Hợp đồng được chọn không tồn tại trong hệ thống.',
            'type.required' => 'Vui lòng chọn loại khoản thu.',
            'type.in' => 'Loại khoản thu không hợp lệ.',
            'title.required' => 'Vui lòng nhập tiêu đề hóa đơn.',
            'title.max' => 'Tiêu đề hóa đơn không được vượt quá 255 ký tự.',
            'due_date.required' => 'Vui lòng chọn hạn thanh toán.',
            'due_date.date' => 'Hạn thanh toán không đúng định dạng ngày.',
            'billing_period_end.after_or_equal' => 'Ngày kết thúc kỳ thanh toán phải sau hoặc bằng ngày bắt đầu.',
            'items.required' => 'Hóa đơn phải có ít nhất 1 hạng mục.',
            'items.min' => 'Hóa đơn phải có ít nhất 1 hạng mục.',
            'items.*.item_name.required' => 'Tên hạng mục không được để trống.',
            'items.*.quantity.required' => 'Số lượng hạng mục là bắt buộc.',
            'items.*.quantity.gt' => 'Số lượng hạng mục phải lớn hơn 0.',
            'items.*.unit_price.required' => 'Đơn giá hạng mục là bắt buộc.',
            'items.*.unit_price.gte' => 'Đơn giá hạng mục không được âm.',
        ];
    }
}
