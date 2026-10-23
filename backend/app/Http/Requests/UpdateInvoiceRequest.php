<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'due_date' => ['sometimes', 'required', 'date'],
            'billing_period_start' => ['nullable', 'date'],
            'billing_period_end' => ['nullable', 'date', 'after_or_equal:billing_period_start'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.item_name' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'gte:0'],
            'items.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Vui lòng nhập tiêu đề hóa đơn.',
            'due_date.required' => 'Vui lòng chọn hạn thanh toán.',
            'billing_period_end.after_or_equal' => 'Ngày kết thúc kỳ thanh toán phải sau hoặc bằng ngày bắt đầu.',
            'items.min' => 'Hóa đơn phải có ít nhất 1 hạng mục.',
            'items.*.item_name.required_with' => 'Tên hạng mục không được để trống.',
            'items.*.quantity.gt' => 'Số lượng hạng mục phải lớn hơn 0.',
            'items.*.unit_price.gte' => 'Đơn giá hạng mục không được âm.',
        ];
    }
}
