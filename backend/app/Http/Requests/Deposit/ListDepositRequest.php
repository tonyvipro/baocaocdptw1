<?php

namespace App\Http\Requests\Deposit;

use App\Traits\NormalizesInput;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ListDepositRequest extends FormRequest
{
    use NormalizesInput;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedStatus = implode(',', config('field_limits.deposit.status.allowed', [
            'all',
            'unpaid',
            'partial_collected',
            'holding',
            'refund_due',
            'partial_refunded',
            'refunded',
            'deducted',
            'collected_any',
            'held_any',
        ]));

        $allowedSort = implode(',', config('field_limits.deposit.sort.allowed', [
            'refund_due_first',
            'end_date_asc',
            'end_date_desc',
            'amount_asc',
            'amount_desc',
            'collection_date_desc',
        ]));

        $allowedPerPage = implode(',', config('field_limits.per_page.allowed', [10, 20, 50]));
        $searchMax = (int) config('field_limits.search.max', 100);

        return [
            'search' => ['nullable', 'string', "max:{$searchMax}"],
            'status' => ['nullable', 'string', "in:{$allowedStatus}"],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'end_from' => ['nullable', 'date'],
            'end_to' => ['nullable', 'date', 'after_or_equal:end_from'],
            'contract_id' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', 'string', "in:{$allowedSort}"],
            'per_page' => ['nullable', 'integer', "in:{$allowedPerPage}"],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $maxDays = (int) config('field_limits.deposit.date_range_max_days', 366);

            if ($this->filled('from_date') && $this->filled('to_date')) {
                try {
                    $from = Carbon::parse($this->input('from_date'));
                    $to = Carbon::parse($this->input('to_date'));
                    if ($from->diffInDays($to) > $maxDays) {
                        $v->errors()->add('to_date', "Khoảng ngày thu tìm kiếm không được vượt quá {$maxDays} ngày.");
                    }
                } catch (\Throwable) {
                }
            }

            if ($this->filled('end_from') && $this->filled('end_to')) {
                try {
                    $from = Carbon::parse($this->input('end_from'));
                    $to = Carbon::parse($this->input('end_to'));
                    if ($from->diffInDays($to) > $maxDays) {
                        $v->errors()->add('end_to', "Khoảng ngày hết hạn HĐ tìm kiếm không được vượt quá {$maxDays} ngày.");
                    }
                } catch (\Throwable) {
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'search.max' => 'Từ khóa tìm kiếm không được vượt quá 100 ký tự.',
            'status.in' => 'Trạng thái lọc tiền cọc không hợp lệ.',
            'to_date.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            'end_to.after_or_equal' => 'Ngày hết hạn đến phải lớn hơn hoặc bằng ngày hết hạn từ.',
            'sort.in' => 'Tiêu chí sắp xếp không hợp lệ.',
            'per_page.in' => 'Số dòng mỗi trang chỉ chấp nhận 10, 20 hoặc 50.',
        ];
    }
}

