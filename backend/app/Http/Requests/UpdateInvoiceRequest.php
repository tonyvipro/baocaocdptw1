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
            'version' => ['required', 'integer', 'min:1'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'due_date' => ['sometimes', 'required', 'date'],
            'billing_period_start' => ['nullable', 'date'],
            'billing_period_end' => ['nullable', 'date', 'after_or_equal:billing_period_start'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['nullable', 'array', 'min:1', 'max:50'],
            'items.*.item_name' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0', 'lte:100000'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'gte:0', 'lte:999999999999'],
            'items.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Thiếu thông tin phiên bản hóa đơn (version).',
            'version.integer' => 'Phiên bản hóa đơn phải là số nguyên.',
            'title.required' => 'Vui lòng nhập tiêu đề hóa đơn.',
            'title.max' => 'Tiêu đề hóa đơn không được vượt quá 255 ký tự.',
            'due_date.required' => 'Vui lòng chọn hạn thanh toán.',
            'billing_period_end.after_or_equal' => 'Ngày kết thúc kỳ thanh toán phải sau hoặc bằng ngày bắt đầu.',
            'note.max' => 'Ghi chú không được vượt quá 2000 ký tự.',
            'items.min' => 'Hóa đơn phải có ít nhất 1 hạng mục.',
            'items.max' => 'Hóa đơn không được vượt quá 50 hạng mục.',
            'items.*.item_name.required_with' => 'Tên hạng mục không được để trống.',
            'items.*.item_name.max' => 'Tên hạng mục không được vượt quá 255 ký tự.',
            'items.*.quantity.gt' => 'Số lượng hạng mục phải lớn hơn 0.',
            'items.*.quantity.lte' => 'Số lượng hạng mục không được vượt quá 100.000.',
            'items.*.unit_price.gte' => 'Đơn giá hạng mục không được âm.',
            'items.*.unit_price.lte' => 'Đơn giá hạng mục không hợp lệ.',
            'items.*.description.max' => 'Mô tả hạng mục không được vượt quá 255 ký tự.',
        ];
    }
}
