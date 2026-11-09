<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user() ?? auth('sanctum')->user() ?? auth()->user();
        if (!$user) {
            return false;
        }
        return in_array((int)$user->role_id, [1, 2, 4]);
    }

    protected function prepareForValidation(): void
    {
        $docId = $this->route('document') ?? $this->route('id');
        if (!is_numeric($docId) || intval($docId) <= 0 || !\App\Models\ContractDocument::where('id', (int) $docId)->exists()) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'success' => false,
                'message' => __('spec_messages.row_3_not_found'),
            ], 404));
        }
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'document_type' => 'nullable|integer|in:0,1,2,3,4,5,6',
            'description' => 'nullable|string|max:250',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Vui lòng nhập tên hiển thị cho tài liệu.',
            'title.max' => 'Tên hiển thị không được vượt quá 255 ký tự.',
            'document_type.required' => 'Vui lòng chọn loại tài liệu.',
            'document_type.in' => 'Loại tài liệu không hợp lệ.',
            'description.max' => 'Ghi chú mô tả tài liệu không được vượt quá 250 ký tự.',
        ];
    }
}
