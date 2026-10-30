<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadExtensionDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => 'required|array|min:1|max:5',
            'files.*' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Vui lòng chọn ít nhất một tệp tài liệu phụ lục đính kèm.',
            'files.array' => 'Dữ liệu tệp tải lên phải là một danh sách file.',
            'files.min' => 'Vui lòng chọn ít nhất một tệp tin.',
            'files.max' => 'Mỗi lần chỉ được tải lên tối đa 5 tệp tin.',
            'files.*.required' => 'Tệp tin không được để trống.',
            'files.*.file' => 'Dữ liệu tải lên phải là tệp tin hợp lệ.',
            'files.*.mimes' => 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận các định dạng: PDF, DOC, DOCX, JPG, JPEG, PNG.',
            'files.*.max' => 'Dung lượng mỗi tệp tin không được vượt quá 10MB (10,240 KB).',
        ];
    }
}
