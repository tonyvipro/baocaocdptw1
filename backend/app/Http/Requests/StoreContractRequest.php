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
            'contract_code' => 'required|string|max:50|unique:contracts,contract_code',
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
            'signing_method' => 'nullable|string|in:ONLINE,DIRECT_MEETING',
            'meeting_location' => 'nullable|string|max:255',
            'meeting_time' => 'nullable|date',
            'notary_office' => 'nullable|string|max:255',
            'is_high_value' => 'nullable|boolean',
        ];
    }

    /**
     * Ràng buộc nghiệp vụ bổ sung (High-Value Business Logic)
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $price = floatval($this->input('rental_price', 0));
            $deposit = floatval($this->input('deposit_amount', 0));
            $signingMethod = $this->input('signing_method', 'ONLINE');

            $isHighValue = \App\Models\Contract::isHighValue($price, $deposit);

            // BĐS giá trị lớn (>= 5 Tỷ) bắt buộc gặp mặt ký trực tiếp & công chứng
            if ($isHighValue) {
                if ($signingMethod === 'ONLINE') {
                    $validator->errors()->add(
                        'signing_method',
                        'Bất động sản có giá trị lớn (≥ 5 Tỷ VNĐ) bắt buộc phải gặp mặt ký kết và công chứng trực tiếp theo quy định pháp luật. Vui lòng chọn phương thức "Gặp mặt ký trực tiếp & Công chứng".'
                    );
                }

                if (empty($this->input('meeting_location'))) {
                    $validator->errors()->add(
                        'meeting_location',
                        'Đối với giao dịch giá trị lớn, vui lòng nhập địa điểm hẹn gặp mặt (Văn phòng công chứng hoặc trụ sở công ty).'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'contract_code.required' => 'Vui lòng nhập mã hợp đồng.',
            'contract_code.max' => 'Mã hợp đồng không được vượt quá 50 ký tự.',
            'contract_code.unique' => 'Mã số hợp đồng đã tồn tại trên hệ thống.',
            'contract_name.required' => 'Vui lòng nhập tên hợp đồng.',
            'contract_name.max' => 'Tên hợp đồng không được vượt quá 255 ký tự.',
            'property_id.required' => 'Vui lòng chọn bất động sản.',
            'property_id.exists' => 'Bất động sản không tồn tại.',
            'broker_id.required' => 'Vui lòng chọn môi giới.',
            'broker_id.exists' => 'Môi giới không tồn tại.',
            'customer_id.required' => 'Vui lòng chọn khách hàng.',
            'customer_id.exists' => 'Khách hàng không tồn tại.',
            'start_date.required' => 'Vui lòng nhập ngày bắt đầu.',
            'end_date.required' => 'Vui lòng nhập ngày kết thúc.',
            'end_date.after' => 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu.',
            'rental_price.numeric' => 'Giá thuê phải là một số.',
            'rental_price.min' => 'Giá thuê không được là số âm.',
            'deposit_amount.numeric' => 'Tiền đặt cọc phải là một số.',
            'deposit_amount.min' => 'Tiền đặt cọc không được là số âm.',
            'signing_method.in' => 'Phương thức ký kết không hợp lệ.',
        ];
    }
}
