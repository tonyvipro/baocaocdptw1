<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Phân quyền đã được xử lý ở Controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'contract_code' => 'required|string|unique:contracts,contract_code',
            'contract_name' => 'required|string|max:255',
            'property_id' => 'required|integer|exists:properties,id',
            'broker_id' => 'required|integer|exists:users,id',
            'customer_id' => 'required|integer|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'deposit_amount' => 'nullable|numeric|min:0',
            'rental_price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'party_a_info' => 'nullable|string',
            'party_b_info' => 'nullable|string',
            'tax_code' => 'nullable|string|max:50',
            'terms' => 'nullable|string',
            'status' => 'nullable|integer|in:0,1,2,3',
        ];
    }

    public function messages(): array
    {
        return [
            'contract_code.required' => 'Mã hợp đồng là bắt buộc.',
            'contract_code.unique' => 'Mã số hợp đồng đã tồn tại trên hệ thống.',
            'contract_name.required' => 'Tên hợp đồng là bắt buộc.',
            'property_id.required' => 'Bất động sản là bắt buộc.',
            'broker_id.required' => 'Môi giới là bắt buộc.',
            'customer_id.required' => 'Khách hàng là bắt buộc.',
            'start_date.required' => 'Ngày bắt đầu là bắt buộc.',
            'end_date.required' => 'Ngày kết thúc là bắt buộc.',
            'end_date.after' => 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu.',
        ];
    }
}
