<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PropertyManagementController extends Controller
{
    private function authorizeProperty(Request $request, ?Property $property = null, bool $adminOnly = false): void
    {
        $user = $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập lại.');
        $admin = (int) $user->role_id === 1;
        abort_unless($admin || (!$adminOnly && (!$property || (int) $property->user_id === (int) $user->id)), 403, 'Bạn không có quyền quản lý tin này.');
    }

    private function rules(bool $create): array
    {
        $rules = [
            'title' => ($create ? 'required' : 'sometimes|required').'|string|max:255',
            'purpose' => ($create ? 'required' : 'sometimes').'|in:sale,rent,project',
            'type' => ($create ? 'required' : 'sometimes').'|string|max:100',
            'status' => 'sometimes|integer|between:0,4',
            'price' => ['sometimes', 'numeric', 'regex:/^\d+(?:\.\d{1,2})?$/', 'min:0', 'max:9999999999999'],
            'price_sale' => ['nullable', 'numeric', 'regex:/^\d+(?:\.\d{1,2})?$/', 'min:0', 'max:9999999999999'],
            'price_rent' => ['nullable', 'numeric', 'regex:/^\d+(?:\.\d{1,2})?$/', 'min:0', 'max:9999999999999'],
            'area' => [($create ? 'required' : 'sometimes'), 'numeric', 'regex:/^\d+(?:\.\d{1,2})?$/', 'gt:0', 'max:100000000'],
            'property_type_id' => 'nullable|integer|exists:property_types,id',
            'bedrooms' => 'nullable|integer|min:0|max:1000',
            'bathrooms' => 'nullable|integer|min:0|max:1000',
            'floors' => 'nullable|integer|min:1|max:1000',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'expire_date' => 'nullable|date|after:now',
            'description' => 'nullable|string|max:50000',
            'amenities' => 'nullable|array|max:100',
            'amenities.*' => 'string|max:250',
            'build_year' => 'nullable|integer|between:1800,'.(now()->year + 10),
            'image' => 'nullable|url:http,https|max:4096',
            'deposit' => 'nullable|numeric|min:0|max:9999999999999',
        ];
        foreach (['address', 'street', 'district', 'city', 'developer', 'project', 'furniture', 'owner_name', 'owner_phone', 'legal', 'legal_status', 'direction', 'available_date', 'management_fee', 'rent_period_min', 'unit_price'] as $field) {
            $limit = match ($field) {
                'owner_phone', 'direction' => 50,
                'district', 'city', 'legal', 'legal_status', 'available_date', 'management_fee', 'rent_period_min', 'unit_price' => 100,
                default => 255,
            };
            $rules[$field] = 'nullable|string|max:'.$limit;
        }
        foreach (['price', 'price_sale', 'price_rent', 'area'] as $field) {
            array_unshift($rules[$field], 'bail', function ($attribute, $value, $fail) {
                if (preg_match_all('/[0-9]/', (string) $value) > 20) {
                    $fail('Mức giá bạn muốn bán đã nhiều hơn tài sản của tỉ phú Elon Musk');
                }
            });
        }
        return $rules;
    }

    private function validationMessages(): array
    {
        return [
            'title.max' => 'Tiêu đề bất động sản không được vượt quá 255 ký tự.',
            'price.regex' => 'Mức giá chỉ được nhập số thông thường, tối đa 2 chữ số thập phân; không dùng chữ e.',
            'price.numeric' => 'Mức giá phải là số.',
            'price.max' => 'Mức giá không được vượt quá 9.999.999.999.999 VNĐ.',
            'area.regex' => 'Diện tích chỉ được nhập số thông thường, tối đa 2 chữ số thập phân; không dùng chữ e.',
            'area.numeric' => 'Diện tích phải là số.',
            'area.max' => 'Diện tích không được vượt quá 100.000.000 m².',
            'area.gt' => 'Diện tích phải lớn hơn 0.',
            'address.max' => 'Địa chỉ chi tiết không được vượt quá 255 ký tự.',
        ];
    }

    private function pricing(array $data, ?Property $property = null): array
    {
        $purpose = $data['purpose'] ?? $property?->purpose;
        $field = $purpose === 'rent' ? 'price_rent' : 'price_sale';
        $price = array_key_exists('price', $data) ? $data['price'] : ($data[$field] ?? $property?->price ?? $property?->$field ?? 0);
        $data['price'] = $data[$field] = $price;
        $data['price_sale_text'] = $purpose === 'rent' ? null : ((float) $price >= 1e9 ? round($price / 1e9, 2).' tỷ' : round($price / 1e6, 2).' triệu');
        $data['price_rent_text'] = $purpose === 'rent' ? round($price / 1e6, 2).' triệu/tháng' : null;
        if ($purpose === 'rent') $data['price_sale'] = null;
        else $data['price_rent'] = null;
        if (isset($data['address']) && empty($data['street'])) $data['street'] = $data['address'];
        return $data;
    }

    private function assignType(array $data): array
    {
        if (!array_key_exists('type', $data) && !array_key_exists('property_type_id', $data)) return $data;
        $type = !empty($data['property_type_id']) ? PropertyType::find($data['property_type_id']) : PropertyType::where('name', $data['type'] ?? '')->first();
        if ($type) {
            if ((int) $type->status !== 1) throw \Illuminate\Validation\ValidationException::withMessages(['type' => 'Loại bất động sản này đã ngừng sử dụng. Vui lòng chọn loại khác.']);
            $data['property_type_id'] = $type->id;
            $data['type'] = $type->name;
        } else {
            $data['property_type_id'] = null;
        }
        return $data;
    }

    private function log(Request $request, Property $property, string $action, array $old, array $extra = []): void
    {
        DB::table('activity_logs')->insert([
            'user_id' => $request->user()->id, 'table_name' => 'properties', 'record_id' => $property->id,
            'action' => $action, 'old_data' => json_encode($old), 'new_data' => json_encode(array_merge($property->toArray(), $extra)),
            'ip_address' => $request->ip(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules(true), $this->validationMessages());
        $this->authorizeProperty($request);
        $data = $this->pricing($validated);
        if (array_key_exists('amenities', $data)) $data['amenities'] = json_encode($data['amenities'], JSON_UNESCAPED_UNICODE);
        $data['title'] = trim($data['title']);
        abort_if($data['title'] === '', 422, 'Tiêu đề không được để trống.');
        $data['code'] = 'BDS-'.Str::upper(Str::random(12));
        $data['user_id'] = $request->user()->id;
        $data['status'] = (int) $request->user()->role_id === 1 ? (int) ($data['status'] ?? 1) : 0;
        $data['expire_date'] ??= now()->addDays(30);
        $property = DB::transaction(function () use ($request, $data) {
            $property = Property::create($this->assignType($data));
            $this->log($request, $property, 'CREATE', []);
            return $property;
        });
        return response()->json(['data' => $property, 'message' => 'Đã tạo tin bất động sản.'], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate($this->rules(false), $this->validationMessages());
        $property = Property::findOrFail($id);
        $this->authorizeProperty($request, $property);
        $data = $this->pricing($validated, $property);
        if (array_key_exists('amenities', $data)) $data['amenities'] = json_encode($data['amenities'], JSON_UNESCAPED_UNICODE);
        if (array_key_exists('image', $data) && !$data['image']) unset($data['image']);
        if ((int) $request->user()->role_id !== 1) $data['status'] = 0;
        DB::transaction(function () use ($request, $property, $data) {
            $old = $property->toArray();
            $property->update($this->assignType($data));
            $this->log($request, $property, 'UPDATE', $old);
            if ((int) $old['status'] !== (int) $property->status) {
                $this->log($request, $property, 'STATUS', $old);
            }
        });
        return response()->json(['data' => $property, 'message' => 'Đã cập nhật bất động sản.']);
    }

    public function trash(Request $request)
    {
        $this->authorizeProperty($request, adminOnly: true);
        $page = Property::onlyTrashed()->orderByDesc('deleted_at')->paginate(12);
        return response()->json(['data' => $page->items(), 'meta' => ['total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => 12]]);
    }

    private function change(Request $request, int $id, string $action): Property
    {
        $property = Property::withTrashed()->lockForUpdate()->findOrFail($id);
        $this->authorizeProperty($request, $property, in_array($action, ['restore', 'force_delete', 'status']));
        $old = $property->toArray();
        if ($action === 'restore') {
            abort_unless($property->trashed(), 422, 'Tin không nằm trong thùng rác.');
            $property->restore();
        } elseif ($action === 'force_delete') {
            abort_unless($property->trashed(), 422, 'Chỉ xóa vĩnh viễn tin trong thùng rác.');
            $property->forceDelete();
        } else {
            abort_if($property->trashed(), 404, 'Tin đã nằm trong thùng rác.');
            if ($action === 'delete') $property->delete();
            if ($action === 'status') {
                $data = $request->validate(['status' => 'required|integer|between:0,4', 'reason' => 'nullable|string|max:2000', 'expire_days' => 'nullable|integer|between:1,3650']);
                if ((int) $data['status'] === 4 && !trim($data['reason'] ?? '')) {
                    $request->merge(['reason' => 'Tạm ẩn bài đăng.']);
                }
                $property->status = (int) $data['status'];
                if ($property->status === 1 && (!$property->expire_date || Carbon::parse($property->expire_date)->isPast())) {
                    $property->expire_date = now()->addDays($data['expire_days'] ?? 30);
                }
                $property->save();
            }
            if ($action === 'extend') {
                $data = $request->validate(['days' => 'required|integer|between:1,3650', 'note' => 'nullable|string|max:2000']);
                $base = $property->expire_date ? Carbon::parse($property->expire_date)->max(now()) : now();
                $property->expire_date = $base->copy()->addDays($data['days']);
                // Extension must not bypass moderation or unhide a rejected listing.
                if ((int) $property->status === 3) $property->status = 1;
                $property->save();
            }
        }
        $this->log($request, $property, strtoupper($action), $old, $request->only('reason', 'note', 'days'));
        return $property;
    }

    public function action(Request $request, int $id, string $action)
    {
        $property = DB::transaction(fn () => $this->change($request, $id, $action));
        return response()->json(['data' => $property, 'message' => 'Thao tác thành công.']);
    }

    public function bulk(Request $request)
    {
        $this->authorizeProperty($request, adminOnly: true);
        $data = $request->validate(['ids' => 'required|array|min:1|max:100', 'ids.*' => 'required|integer|distinct', 'action' => 'required|in:delete,restore,force_delete,hide,show,approve,reject,extend,change_status']);
        $action = $data['action'];
        $states = ['hide' => 4, 'show' => 1, 'approve' => 1, 'reject' => 4];
        if (array_key_exists($action, $states)) $request->merge(['status' => $states[$action]]);
        if ($action === 'hide' && !$request->filled('reason')) $request->merge(['reason' => 'Tạm ẩn hàng loạt.']);
        $action = array_key_exists($action, $states) || $action === 'change_status' ? 'status' : $action;
        DB::transaction(function () use ($request, $data, $action) {
            foreach ($data['ids'] as $id) $this->change($request, $id, $action);
        });
        return response()->json(['message' => 'Đã xử lý '.count($data['ids']).' bất động sản.']);
    }

    public function history(Request $request, int $id, string $action)
    {
        $property = Property::withTrashed()->findOrFail($id);
        $this->authorizeProperty($request, $property);
        $logs = DB::table('activity_logs')->where('table_name', 'properties')->where('record_id', $id)
            ->where('action', strtoupper($action))->orderByDesc('id')->limit(100)->get()->map(function ($log) {
                $old = json_decode($log->old_data, true) ?? [];
                $new = json_decode($log->new_data, true) ?? [];
                return array_merge((array) $log, ['old_data' => $old, 'new_data' => $new, 'old_status' => $old['status'] ?? null, 'new_status' => $new['status'] ?? null, 'reason' => $new['reason'] ?? '', 'note' => $new['note'] ?? '', 'days' => $new['days'] ?? null, 'old_expire_date' => $old['expire_date'] ?? null, 'new_expire_date' => $new['expire_date'] ?? null]);
            });
        return response()->json(['data' => $logs]);
    }
}
