<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\Property;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize()
    {
        // Khách hàng bắt buộc phải đăng nhập
        return auth('sanctum')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules()
    {
        return [
            'broker_id' => [
                'required', 
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    // [Lỗi Logic Mở Rộng]: Kiểm tra xem môi giới có hợp lệ không (có role là Môi giới hoặc Admin)
                    // (Giả sử logic DB của bạn role_id = 2 là Môi giới). Ở đây ta tạm kiểm tra có tồn tại.
                }
            ],
            'property_id' => [
                'required', 
                'exists:properties,id',
                function ($attribute, $value, $fail) {
                    // [Lỗi Logic Mở Rộng]: BĐS phải đang ở trạng thái hiển thị/Đang bán (status = 1)
                    $property = Property::find($value);
                    if ($property && $property->status != 1) {
                        $fail('Bất động sản này hiện không còn khả dụng để đặt lịch.');
                    }
                    
                    // [Lỗi Logic Mở Rộng]: Kiểm tra xem broker_id có đúng là người phụ trách BĐS này không
                    if ($property && $property->user_id != $this->broker_id) {
                        $fail('Môi giới này không phụ trách bất động sản bạn chọn.');
                    }
                }
            ],
            'appointment_time' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $appointmentTime = Carbon::parse($value);
                    
                    // 1. Kiểm tra thời gian hẹn phải lớn hơn thời điểm hiện tại ít nhất 2 giờ
                    if ($appointmentTime->lessThan(Carbon::now()->addHours(2))) {
                        $fail('Thời gian hẹn phải lớn hơn thời điểm hiện tại ít nhất 2 giờ.');
                    }

                    // 2. [Lỗi Logic Mở Rộng]: Kiểm tra thời gian phải trong giờ hành chính (VD: 08:00 - 20:00)
                    $hour = $appointmentTime->hour;
                    if ($hour < 8 || $hour >= 20) {
                        $fail('Thời gian hẹn phải nằm trong giờ làm việc (08:00 - 20:00).');
                    }

                    // 3. [Lỗi Logic Mở Rộng]: Không được đặt lịch vào quá khứ (đã xử lý bởi điều kiện 1)
                },
            ],
            'phone' => ['required', 'regex:/^(03|05|07|08|09)\d{8}$/'],
            'note' => ['nullable', 'string'],
        ];
    }

    /**
     * Custom message cho các lỗi validation
     */
    public function messages()
    {
        return [
            'appointment_time.required' => 'Vui lòng chọn thời gian hẹn.',
            'appointment_time.date' => 'Định dạng ngày giờ không hợp lệ.',
            'phone.required' => 'Vui lòng nhập số điện thoại liên hệ.',
            'phone.regex' => 'Số điện thoại liên hệ không hợp lệ.',
            'broker_id.required' => 'Mã môi giới là bắt buộc.',
            'broker_id.exists' => 'Môi giới không tồn tại trên hệ thống.',
            'property_id.required' => 'Mã bất động sản là bắt buộc.',
            'property_id.exists' => 'Bất động sản không tồn tại trên hệ thống.',
        ];
    }
}
