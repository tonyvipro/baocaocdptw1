<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractExtensionDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user() ?? auth('sanctum')->user() ?? auth()->user();
        if (!$user) {
            return false;
        }
        return in_array((int)$user->role_id, [1, 2, 4]); // 1: Admin, 2: Môi giới, 4: Nhân viên
    }

    protected function prepareForValidation(): void
    {
        $contractId = $this->route('contract') ?? $this->route('id');
        if (!is_numeric($contractId) || intval($contractId) <= 0 || !\App\Models\Contract::where('id', (int) $contractId)->exists()) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404));
        }
        if ($contractId && is_numeric($contractId)) {
            $contract = \App\Models\Contract::find((int) $contractId);
            if ($contract && in_array((int) $contract->status, [2, 3], true)) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Hợp đồng đã thanh lý hoặc bị hủy, không thể gia hạn.',
                ], 422));
            }
            if ($contract && $this->has('new_end_date') && !$this->has('new_start_date')) {
                $oldEnd = \Carbon\Carbon::parse($contract->end_date)->startOfDay();
                $newEnd = \Carbon\Carbon::parse($this->input('new_end_date'))->startOfDay();
                if ($newEnd->lte($oldEnd)) {
                    throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                        'success' => false,
                        'message' => 'Ngày kết thúc gia hạn phải lớn hơn ngày hết hạn hợp đồng cũ.',
                        'errors' => [
                            'new_end_date' => ['Ngày kết thúc gia hạn phải lớn hơn ngày hết hạn hợp đồng cũ.'],
                        ],
                    ], 422));
                }
                $this->merge([
                    'extension_type' => $this->input('extension_type', 1),
                    'duration_months' => $this->input('duration_months', 6),
                    'new_start_date' => $oldEnd->copy()->addDay()->toDateString(),
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'extension_type' => 'required|integer|in:0,1,2',
            'duration_months' => 'required|integer|in:3,6,12',
            'new_start_date' => 'required|date',
            'new_end_date' => 'nullable|date',
            'new_rental_price' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string|max:2000',
            'note' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'extension_type.required' => 'Vui lòng chọn loại hình gia hạn.',
            'extension_type.in' => 'Loại hình gia hạn không hợp lệ (0: Tự động, 1: Thủ công, 2: Theo điều khoản mới).',
            'duration_months.required' => 'Vui lòng chọn thời gian gia hạn.',
            'duration_months.in' => 'Thời gian gia hạn chỉ được chọn 3 tháng, 6 tháng hoặc 12 tháng (1 năm).',
            'new_start_date.required' => 'Vui lòng chọn ngày bắt đầu gia hạn mới.',
            'new_start_date.date' => 'Ngày bắt đầu gia hạn không đúng định dạng ngày tháng.',
            'new_rental_price.numeric' => 'Giá trị hợp đồng mới phải là số tiền hợp lệ.',
            'new_rental_price.min' => 'Giá trị hợp đồng mới không được là số âm.',
            'reason.max' => 'Lý do gia hạn không được vượt quá 2000 ký tự.',
        ];
    }
}
