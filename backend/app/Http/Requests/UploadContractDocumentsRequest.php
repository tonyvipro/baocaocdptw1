<?php

namespace App\Http\Requests;

use App\Models\ContractDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UploadContractDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user() ?? auth('sanctum')->user() ?? auth()->user();
        if (!$user) {
            return false;
        }
        // Chỉ nhân viên/môi giới/admin (1, 2, 4) mới được upload
        return in_array((int)$user->role_id, [1, 2, 4]);
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

        if (!$this->hasFile('files') && $this->hasFile('file')) {
            $singleFile = $this->file('file');
            $filesArray = is_array($singleFile) ? $singleFile : [$singleFile];
            $this->files->set('files', $filesArray);
            $this->merge(['files' => $filesArray]);
        }
    }

    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1|max:20',
            'files.*' => [
                'required',
                'file',
                'max:10240', // 10MB = 10240 KB
                'mimes:pdf,doc,docx,jpg,jpeg,png',
            ],
            'document_type' => 'nullable|integer|in:0,1,2,3,4,5,6',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:250',
            'extension_id' => 'nullable|integer|exists:contract_extensions,id',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $files = $this->file('files');
            if (!is_array($files)) {
                return;
            }

            $allowedMimes = ContractDocument::ALLOWED_MIMES;

            foreach ($files as $index => $file) {
                if (!$file || !$file->isValid()) {
                    $validator->errors()->add("files.{$index}", "Tệp số " . ($index + 1) . " không hợp lệ hoặc bị lỗi trong quá trình tải lên.");
                    continue;
                }

                // Kiểm tra MIME thực tế bằng finfo, không tin tưởng header client
                $realMime = $file->getMimeType();
                if (!in_array($realMime, $allowedMimes)) {
                    $validator->errors()->add(
                        "files.{$index}",
                        "Tệp đính kèm không đúng định dạng (Chỉ hỗ trợ PDF, DOCX, JPG)."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Vui lòng chọn ít nhất một tệp tài liệu để tải lên.',
            'files.array' => 'Dữ liệu tệp tải lên phải là một danh sách mảng.',
            'files.min' => 'Vui lòng chọn ít nhất 1 tệp.',
            'files.max' => 'Mỗi lần chỉ được tải lên tối đa 20 tệp.',
            'files.*.required' => 'Tệp tải lên không được để trống.',
            'files.*.file' => 'Dữ liệu tải lên phải là tệp tin hợp lệ.',
            'files.*.max' => 'Dung lượng tệp không được vượt quá 10MB.',
            'files.*.mimes' => 'Tệp đính kèm không đúng định dạng (Chỉ hỗ trợ PDF, DOCX, JPG).',
            'document_type.in' => 'Loại tài liệu không hợp lệ (0: HĐ chính, 1: Phụ lục, 2: Tùy thân, 3: BĐS, 4: Bàn giao, 5: Khác).',
            'title.max' => 'Tên hiển thị tài liệu không được vượt quá 255 ký tự.',
            'description.max' => 'Ghi chú mô tả tài liệu không được vượt quá 250 ký tự.',
            'extension_id.exists' => 'Phụ lục gia hạn được chỉ định không tồn tại.',
        ];
    }
}
