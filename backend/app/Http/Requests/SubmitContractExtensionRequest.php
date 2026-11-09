<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitContractExtensionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $extId = $this->route('extension') ?? $this->route('id');
        if (!is_numeric($extId) || intval($extId) <= 0 || !\App\Models\ContractExtension::where('id', (int) $extId)->exists()) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404));
        }
    }

    public function rules(): array
    {
        return [
            'reason' => 'sometimes|required|string|max:2000',
            'note' => 'nullable|string',
            'extension_type' => 'sometimes|integer|in:0,1,2',
            'duration_months' => 'sometimes|integer|in:3,6,12',
            'new_start_date' => 'sometimes|date',
            'new_rental_price' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Lý do gia hạn hợp đồng là bắt buộc khi gửi yêu cầu phê duyệt.',
            'reason.max' => 'Lý do gia hạn không được vượt quá 2000 ký tự.',
            'new_rental_price.numeric' => 'Giá trị hợp đồng mới phải là số tiền hợp lệ.',
            'new_rental_price.min' => 'Giá trị hợp đồng mới không được là số âm.',
        ];
    }
}
