<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

class RescheduleAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Xử lý phân quyền chi tiết trong Controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Bắt buộc nhập, phải là kiểu ngày tháng, và phải sau 2 tiếng kể từ hiện tại
            'new_appointment_time' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $time = Carbon::parse($value);
                    if ($time->isPast() || $time->diffInHours(now()) < 2) {
                        $fail('Thời gian hẹn mới phải diễn ra ít nhất 2 tiếng kể từ thời điểm hiện tại.');
                    }
                },
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'new_appointment_time.required' => 'Vui lòng chọn thời gian hẹn mới.',
            'new_appointment_time.date' => 'Thời gian hẹn mới không đúng định dạng.',
        ];
    }
}
