<?php

namespace App\Http\Requests;

use App\Models\Broker;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class TransferBrokerAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_broker_id' => ['required', 'integer', 'exists:brokers,id'],
            'reason' => ['nullable', 'string', 'max:250'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_broker_id.required' => 'Vui lòng chọn môi giới nhận điều chuyển.',
            'target_broker_id.exists' => 'Môi giới nhận điều chuyển không tồn tại trong hệ thống.',
            'reason.max' => 'Lý do điều chuyển không được vượt quá 250 ký tự.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('target_broker_id')) {
                    return;
                }

                $targetBroker = Broker::whereNull('deleted_at')->find($this->input('target_broker_id'));
                if (!$targetBroker) {
                    $validator->errors()->add('target_broker_id', 'Môi giới nhận điều chuyển đã bị xóa hoặc không tồn tại.');
                    return;
                }

                // 1. Chặn môi giới có trạng thái tạm ngưng
                if ($targetBroker->status === 'inactive' || $targetBroker->status === 'suspended') {
                    $validator->errors()->add('target_broker_id', "Môi giới '{$targetBroker->name}' đang ở trạng thái tạm ngưng, không thể nhận điều chuyển.");
                }

                // 2. Chặn môi giới chưa liên kết tài khoản
                if (!$targetBroker->user_id) {
                    $validator->errors()->add('target_broker_id', "Môi giới '{$targetBroker->name}' chưa liên kết tài khoản người dùng, không thể nhận điều chuyển.");
                    return;
                }

                // 3. Chặn tài khoản người dùng của môi giới bị khóa
                $user = $targetBroker->user;
                if (!$user || !$user->is_active) {
                    $validator->errors()->add('target_broker_id', "Tài khoản người dùng của môi giới '{$targetBroker->name}' đang bị khóa hoặc không hoạt động.");
                }
            }
        ];
    }
}

