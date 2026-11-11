<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDemand;
use App\Models\District;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\Province;
use App\Models\User;
use App\Models\Ward;
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
        abort_unless($user->hasPermission('demands.manage'), 403, 'Chỉ Admin và Môi giới được quản lý nhu cầu.');
        abort_unless(Schema::hasTable('customer_demands'), 503, 'Chức năng nhu cầu chưa được khởi tạo. Vui lòng chạy migration bổ sung cho bảng customer_demands.');
        abort_unless(Schema::hasColumn('property_types', 'status'), 503, 'Danh mục loại BĐS chưa được cập nhật. Vui lòng chạy migration bổ sung cho property_types.');
        return $user;
    }

    private function visible(User $user)
    {
        return CustomerDemand::query()->whereHas('customer', function ($query) use ($user) {
            if (!$user->hasPermission('customers.view_all')) $query->where('assigned_to', $user->id);
        });
    }

    public function options(Request $request)
    {
        $this->manager($request);
        return response()->json([
            'statuses' => CustomerDemand::STATUSES,
            'property_types' => PropertyType::orderBy('name')->get(['id', 'name', 'status']),
            'categories' => Category::whereNull('deleted_at')->orderBy('display_order')->orderBy('name')->get(['id', 'name', 'description']),
            'provinces' => Province::orderBy('name')->get(['id', 'name']),
            'districts' => District::orderBy('name')->get(['id', 'province_id', 'name']),
            'wards' => Ward::orderBy('name')->get(['id', 'district_id', 'name']),
        ]);
    }

    public function index(Request $request)
    {
        $user = $this->manager($request);
        $money = ['nullable', 'integer', 'min:0', 'max:999999999999999', 'regex:/^[0-9]{1,15}$/D'];
        $filters = $request->validate([
            'search' => 'nullable|string|max:250',
            'property_type_id' => 'nullable|integer|exists:property_types,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'province_id' => 'nullable|integer|exists:provinces,id',
            'district_id' => 'nullable|integer|exists:districts,id',
            'ward_id' => 'nullable|integer|exists:wards,id',
            'bedrooms' => 'nullable|integer|min:0|max:100',
            'area' => 'nullable|string|max:250',
            'status' => ['nullable', Rule::in(array_keys(CustomerDemand::STATUSES))],
            'budget_min' => $money,
            'budget_max' => [...$money, Rule::when($request->filled('budget_min') && $request->filled('budget_max'), 'gte:budget_min')],
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ], ['budget_max.gte' => 'Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.']);

        $query = $this->visible($user)->with(['customer', 'propertyType', 'category', 'province', 'district', 'ward']);
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('area', 'like', '%'.$search.'%')->orWhere('notes', 'like', '%'.$search.'%')
                    ->orWhereHas('propertyType', fn ($type) => $type->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('category', fn ($cat) => $cat->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('district', fn ($dist) => $dist->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where(function ($fields) use ($search) {
                            foreach (['name', 'phone', 'email', 'company'] as $field) $fields->orWhere($field, 'like', '%'.$search.'%');
                        });
                    });
                if (preg_match('/^ND-0*([0-9]+)$/i', $search, $matches)) $q->orWhere('id', (int) $matches[1] - 1000);
            });
        }
        foreach (['property_type_id', 'category_id', 'province_id', 'district_id', 'ward_id', 'bedrooms', 'status'] as $field) {
            if (!empty($filters[$field])) $query->where($field, $filters[$field]);
        }
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
        return response()->json(['data' => $this->visible($this->manager($request))->with(['customer', 'propertyType', 'category', 'province', 'district', 'ward'])->findOrFail($id)]);
    }

    private function data(Request $request, User $user, ?CustomerDemand $demand = null): array
    {
        $money = ['required', 'integer', 'min:0', 'max:999999999999999', 'regex:/^[0-9]{1,15}$/D'];
        $data = $request->validate([
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where(function ($q) use ($user) {
                $q->whereNull('deleted_at');
                if (!$user->hasPermission('customers.view_all')) $q->where('assigned_to', $user->id);
            })],
            'property_type_id' => ['nullable', 'integer', Rule::exists('property_types', 'id')->where(function ($q) use ($demand) {
                $q->where(fn ($type) => $type->where('status', 1)->when($demand && $demand->property_type_id, fn ($old) => $old->orWhere('id', $demand->property_type_id)));
            })],
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'province_id' => ['nullable', 'integer', Rule::exists('provinces', 'id')],
            'district_id' => ['nullable', 'integer', Rule::exists('districts', 'id')],
            'ward_id' => ['nullable', 'integer', Rule::exists('wards', 'id')],
            'location_ids' => ['nullable', 'array'],
            'location_ids.*' => ['integer'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:100'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:100'],
            'budget_min' => $money,
            'budget_max' => [...$money, 'gte:budget_min'],
            'area' => 'nullable|string|max:250',
            'notes' => 'nullable|string|max:250',
            'status' => ['required', Rule::in(array_keys(CustomerDemand::STATUSES))],
        ], [
            'customer_id.required' => 'Vui lòng chọn khách hàng.',
            'customer_id.exists' => 'Khách hàng không tồn tại hoặc không thuộc phạm vi quản lý của bạn.',
            'category_id.exists' => 'Danh mục loại BĐS không tồn tại hoặc đã bị xóa.',
            'property_type_id.exists' => 'Loại bất động sản không còn hoạt động.',
            'budget_min.required' => 'Vui lòng nhập ngân sách từ.',
            'budget_max.required' => 'Vui lòng nhập ngân sách đến.',
            'budget_max.gte' => 'Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.',
            '*.integer' => 'Vui lòng nhập số nguyên hợp lệ.',
            'budget_min.regex' => 'Ngân sách chỉ gồm tối đa 20 chữ số.',
            'budget_max.regex' => 'Ngân sách chỉ gồm tối đa 20 chữ số.',
            'area.max' => 'Khu vực không được vượt quá 250 ký tự.',
            'notes.max' => 'Ghi chú không được vượt quá 250 ký tự.',
        ]);

        // Tự động điền chuỗi area từ mã khu vực nếu người dùng không nhập area
        if (empty($data['area'])) {
            $parts = [];
            if (!empty($data['ward_id'])) {
                $ward = Ward::find($data['ward_id']);
                if ($ward) $parts[] = $ward->name;
            }
            if (!empty($data['district_id'])) {
                $district = District::find($data['district_id']);
                if ($district) $parts[] = $district->name;
            }
            if (!empty($data['province_id'])) {
                $province = Province::find($data['province_id']);
                if ($province) $parts[] = $province->name;
            }
            if (!empty($parts)) {
                $data['area'] = implode(', ', $parts);
            }
        }

        // Tự động đồng bộ property_type_id nếu truyền category_id mà chưa truyền property_type_id
        if (empty($data['property_type_id']) && !empty($data['category_id'])) {
            $cat = Category::find($data['category_id']);
            if ($cat) {
                $matchedType = PropertyType::where('name', $cat->name)->where('status', 1)->first();
                if ($matchedType) {
                    $data['property_type_id'] = $matchedType->id;
                }
            }
        }

        return $data;
    }

    private function lockCustomer(User $user, int $id): void
    {
        Customer::whereKey($id)->when(!$user->hasPermission('customers.view_all'), fn ($q) => $q->where('assigned_to', $user->id))->lockForUpdate()->firstOrFail();
    }

    public function store(Request $request)
    {
        $user = $this->manager($request);
        return DB::transaction(function () use ($request, $user) {
            $data = $this->data($request, $user);
            $this->lockCustomer($user, (int) $data['customer_id']);
            $demand = CustomerDemand::create($data + ['created_by' => $user->id]);
            return response()->json(['data' => $demand->load(['customer', 'propertyType', 'category', 'province', 'district', 'ward']), 'message' => 'Đã thêm nhu cầu mới.'], 201);
        });
    }

    private function checkVersion(Request $request, CustomerDemand $demand): void
    {
        $data = $request->validate(['version' => 'required|integer|min:1']);
        if ((int) $data['version'] !== $demand->version) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'code' => 'STALE_VERSION', 'message' => 'Nhu cầu vừa được cập nhật. Vui lòng tải lại trước khi sửa hoặc xóa.',
            ], 409));
        }
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
            return response()->json(['data' => $demand->load(['customer', 'propertyType', 'category', 'province', 'district', 'ward']), 'message' => 'Đã cập nhật nhu cầu.']);
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

    /**
     * API Ghép tự động BĐS phù hợp với nhu cầu của khách hàng
     */
    public function matchingProperties(Request $request, int $id)
    {
        $user = $this->manager($request);
        $demand = $this->visible($user)->findOrFail($id);

        $query = Property::query()->whereNull('deleted_at');

        // 1. Khớp loại BĐS (category_id hoặc property_type_id)
        if ($demand->category_id) {
            $query->where('category_id', $demand->category_id);
        } elseif ($demand->property_type_id) {
            $query->where('property_type_id', $demand->property_type_id);
        }

        // 2. Khớp khu vực (dạng mã hoặc JSON location_ids)
        if ($demand->ward_id) {
            $query->where('ward_id', $demand->ward_id);
        } elseif ($demand->district_id) {
            $query->where('district_id', $demand->district_id);
        } elseif (!empty($demand->location_ids) && is_array($demand->location_ids)) {
            $query->whereIn('district_id', $demand->location_ids);
        } elseif ($demand->province_id) {
            $query->where('province_id', $demand->province_id);
        } elseif ($demand->area) {
            $query->where(function ($q) use ($demand) {
                $q->where('district', 'like', "%{$demand->area}%")
                  ->orWhere('city', 'like', "%{$demand->area}%")
                  ->orWhere('address', 'like', "%{$demand->area}%");
            });
        }

        // 3. Khớp ngân sách VNĐ (budget_min, budget_max)
        if ($demand->budget_max > 0) {
            $query->where(function ($q) use ($demand) {
                $q->where(function ($sq) use ($demand) {
                    $sq->whereNotNull('price_sale')
                       ->where('price_sale', '>=', $demand->budget_min)
                       ->where('price_sale', '<=', $demand->budget_max);
                })->orWhere(function ($sq) use ($demand) {
                    $sq->whereNotNull('price_rent')
                       ->where('price_rent', '>=', $demand->budget_min)
                       ->where('price_rent', '<=', $demand->budget_max);
                })->orWhere(function ($sq) use ($demand) {
                    $sq->whereNotNull('price')
                       ->where('price', '>=', $demand->budget_min)
                       ->where('price', '<=', $demand->budget_max);
                });
            });
        }

        // 4. Khớp số phòng ngủ (bedrooms)
        if ($demand->bedrooms) {
            $query->where('bedrooms', '>=', $demand->bedrooms);
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $properties = $query->with(['category', 'propertyType'])->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'demand' => $demand->load(['customer', 'category', 'province', 'district', 'ward']),
            'data' => $properties->items(),
            'meta' => [
                'total' => $properties->total(),
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
            ],
        ]);
    }
}

