<?php

namespace App\Http\Requests;

use App\Traits\NormalizesInput;
use Illuminate\Foundation\Http\FormRequest;

class RentPaymentIndexRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('page')) {
            $page = $this->query('page');
            if (!is_numeric($page) || intval($page) <= 0 || (string) intval($page) !== (string) $page) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                    'message' => __('spec_messages.row_10_invalid_url_param'),
                ], 404));
            }
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'month' => ['nullable', 'string', 'regex:/^(\d{4}-(0[1-9]|1[0-2])|all)$/'],
            'status' => ['nullable', 'string', 'in:paid,partial,overdue,unpaid,upcoming,cancelled'],
            'sort' => ['nullable', 'string', 'in:overdue_first,due_date_asc,due_date_desc,amount_asc,amount_desc'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'search.max' => 'Từ khóa tìm kiếm không được vượt quá 100 ký tự.',
            'month.regex' => 'Định dạng tháng phải là YYYY-MM hoặc chuỗi "all".',
            'status.in' => 'Trạng thái lọc không hợp lệ.',
            'sort.in' => 'Tiêu chí sắp xếp không hợp lệ.',
            'per_page.in' => 'Số dòng trên mỗi trang chỉ được là 10, 20 hoặc 50.',
            'page.min' => 'Số trang phải lớn hơn hoặc bằng 1.',
        ];
    }
}
