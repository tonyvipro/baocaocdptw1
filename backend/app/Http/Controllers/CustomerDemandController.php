<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CustomerDemandController extends Controller
{
    private function manager(Request $request): User
    {
        $user = $request->bearerToken() ? auth('sanctum')->user() : $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập lại.');
        abort_unless(in_array((int) $user->role_id, [1, 2], true), 403, 'Chỉ Admin và Môi giới được quản lý nhu cầu.');
        abort_unless(Schema::hasTable('customer_demands'), 503, 'Chức năng nhu cầu chưa được khởi tạo. Vui lòng chạy migration bổ sung cho bảng customer_demands.');
        abort_unless(Schema::hasColumn('property_types', 'status'), 503, 'Danh mục loại BĐS chưa được cập nhật. Vui lòng chạy migration bổ sung cho property_types.');
        return $user;
    }

    private function visible(User $user)
    {
        return CustomerDemand::query()->whereHas('customer', function ($query) use ($user) {
            if ((int) $user->role_id !== 1) $query->where('assigned_to', $user->id);
        });
    }

    public function options(Request $request)
    {
        $this->manager($request);
        return response()->json(['statuses' => CustomerDemand::STATUSES,
            'property_types' => PropertyType::orderBy('name')->get(['id', 'name', 'status'])]);
    }

    public function index(Request $request)
    {
        $user = $this->manager($request);
        $money = ['nullable', 'integer', 'min:0', 'max:999999999999999', 'regex:/^[0-9]{1,15}$/D'];
        $filters = $request->validate([
            'search' => 'nullable|string|max:250', 'property_type_id' => 'nullable|integer|exists:property_types,id',
            'area' => 'nullable|string|max:250', 'status' => ['nullable', Rule::in(array_keys(CustomerDemand::STATUSES))],
            'budget_min' => $money, 'budget_max' => [...$money, Rule::when($request->filled('budget_min') && $request->filled('budget_max'), 'gte:budget_min')],
            'page' => 'nullable|integer|min:1', 'per_page' => 'nullable|integer|min:1|max:50',
        ], ['budget_max.gte' => 'Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.']);
        $query = $this->visible($user)->with(['customer', 'propertyType']);
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('area', 'like', '%'.$search.'%')->orWhere('notes', 'like', '%'.$search.'%')
                    ->orWhereHas('propertyType', fn ($type) => $type->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where(function ($fields) use ($search) {
                            foreach (['name', 'phone', 'email', 'company'] as $field) $fields->orWhere($field, 'like', '%'.$search.'%');
                        });
                    });
                if (preg_match('/^ND-0*([0-9]+)$/i', $search, $matches)) $q->orWhere('id', (int) $matches[1] - 1000);
            });
        }
        foreach (['property_type_id', 'status'] as $field) if (!empty($filters[$field])) $query->where($field, $filters[$field]);
        if (!empty($filters['area'])) $query->where('area', 'like', '%'.trim($filters['area']).'%');
        // Match any overlap with the customer's budget range, including a zero lower bound.
        if (isset($filters['budget_min'])) $query->where('budget_max', '>=', $filters['budget_min']);
        if (isset($filters['budget_max'])) $query->where('budget_min', '<=', $filters['budget_max']);
        $rows = $query->orderByDesc('created_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 10);
        return response()->json(['data' => $rows->items(), 'meta' => ['total' => $rows->total(), 'from' => $rows->firstItem(),
            'to' => $rows->lastItem(), 'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage()]])->header('Cache-Control', 'no-store');
    }

    public function show(Request $request, int $id)
    {
        return response()->json(['data' => $this->visible($this->manager($request))->with(['customer', 'propertyType'])->findOrFail($id)]);
    }

    private function data(Request $request, User $user, ?CustomerDemand $demand = null): array
    {
        return $request->validate([
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where(function ($q) use ($user) {
                $q->whereNull('deleted_at');
                if ((int) $user->role_id !== 1) $q->where('assigned_to', $user->id);
            })],
            'property_type_id' => ['required', 'integer', Rule::exists('property_types', 'id')->where(function ($q) use ($demand) {
                $q->where(fn ($type) => $type->where('status', 1)->when($demand, fn ($old) => $old->orWhere('id', $demand->property_type_id)));
            })],
            'budget_min' => ['required', 'integer', 'min:0', 'max:999999999999999', 'regex:/^[0-9]{1,15}$/D'],
            'budget_max' => ['required', 'integer', 'min:0', 'max:999999999999999', 'regex:/^[0-9]{1,15}$/D', 'gte:budget_min'],
            'area' => 'required|string|max:250', 'notes' => 'nullable|string|max:250',
            'status' => ['required', Rule::in(array_keys(CustomerDemand::STATUSES))],
        ], [
            'customer_id.required' => 'Vui lòng chọn khách hàng.', 'customer_id.exists' => 'Khách hàng không tồn tại hoặc không thuộc phạm vi quản lý của bạn.',
            'property_type_id.required' => 'Vui lòng chọn loại bất động sản.', 'property_type_id.exists' => 'Loại bất động sản không còn hoạt động.',
            'budget_min.required' => 'Vui lòng nhập ngân sách từ.', 'budget_max.required' => 'Vui lòng nhập ngân sách đến.',
            'budget_max.gte' => 'Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.', '*.integer' => 'Vui lòng nhập số nguyên hợp lệ.',
            'budget_min.regex' => 'Ngân sách chỉ gồm tối đa 15 chữ số.', 'budget_max.regex' => 'Ngân sách chỉ gồm tối đa 15 chữ số.',
            'area.required' => 'Vui lòng nhập khu vực cần tìm.', 'area.max' => 'Khu vực không được vượt quá 250 ký tự.',
            'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
        ]);
    }

    private function lockCustomer(User $user, int $id): void
    {
        Customer::whereKey($id)->when((int) $user->role_id !== 1, fn ($q) => $q->where('assigned_to', $user->id))->lockForUpdate()->firstOrFail();
    }

    public function store(Request $request)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user) {
            $data = $this->data($request, $user);
            $this->lockCustomer($user, (int) $data['customer_id']);
            $demand = CustomerDemand::create($data + ['created_by' => $user->id]);
            return response()->json(['data' => $demand->load(['customer', 'propertyType']), 'message' => 'Đã thêm nhu cầu mới.'], 201);
        });
    }

    private function checkVersion(Request $request, CustomerDemand $demand): void
    {
        $data = $request->validate(['version' => 'required|integer|min:1']);
        abort_if((int) $data['version'] !== $demand->version, 409, 'Nhu cầu vừa được cập nhật. Vui lòng tải lại trước khi sửa hoặc xóa.');
    }

    public function update(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $demand = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->lockCustomer($user, $demand->customer_id);
            $this->checkVersion($request, $demand);
            $data = $this->data($request, $user, $demand);
            $this->lockCustomer($user, (int) $data['customer_id']);
            $demand->fill($data);
            $demand->version++;
            $demand->save();
            return response()->json(['data' => $demand->load(['customer', 'propertyType']), 'message' => 'Đã cập nhật nhu cầu.']);
        });
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user, $id) {
            $demand = $this->visible($user)->lockForUpdate()->findOrFail($id);
            $this->lockCustomer($user, $demand->customer_id);
            $this->checkVersion($request, $demand);
            $demand->delete();
            return response()->json(['message' => 'Đã xóa nhu cầu khỏi danh sách.']);
        });
    }
}
