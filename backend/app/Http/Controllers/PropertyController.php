<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PropertyController extends Controller
{
    /**
     * Lấy danh sách Bất Động Sản (Có hỗ trợ Filter, Search, Pagination, Sort)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Property::with(['user', 'propertyType', 'images']);

        // 1. Tìm kiếm (Địa chỉ, Mã BĐS, Tiêu đề, Dự án, Tên người phụ trách)
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('project', 'like', "%{$search}%")
                  ->orWhere('street', 'like', "%{$search}%")
                  ->orWhere('district', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // 2. Lọc theo Loại BĐS
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $type = $request->input('type');
            if (is_numeric($type)) {
                $query->where('property_type_id', $type);
            } else {
                $query->where('type', $type);
            }
        }

        // 3. Lọc theo Trạng thái (0: Chờ duyệt, 1: Đang hiển thị, 2: Đã bán/thuê, 3: Hết hạn, 4: Đã ẩn)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // 4. Lọc theo Mục đích (sale, rent, project)
        if ($request->filled('purpose') && $request->input('purpose') !== 'all') {
            $query->where('purpose', $request->input('purpose'));
        }

        // Lọc theo người đăng (Môi giới / Chủ nhà xem tin của mình)
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // 5. Lọc theo Tỉnh/Thành hoặc Khu vực
        if ($request->filled('city') && $request->input('city') !== 'all') {
            $query->where('city', $request->input('city'));
        }
        if ($request->filled('district') && $request->input('district') !== 'all') {
            $query->where('district', $request->input('district'));
        }

        // 6. Lọc theo khoảng Giá
        if ($request->filled('price_min')) {
            $query->where('price', '>=', (float) $request->input('price_min'));
        }
        if ($request->filled('price_max')) {
            $query->where('price', '<=', (float) $request->input('price_max'));
        }

        // 7. Lọc theo Diện tích
        if ($request->filled('area_min')) {
            $query->where('area', '>=', (float) $request->input('area_min'));
        }
        if ($request->filled('area_max')) {
            $query->where('area', '<=', (float) $request->input('area_max'));
        }

        // 8. Sắp xếp
        $sortBy = $request->input('sort', 'newest');
        switch ($sortBy) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'area_asc':
                $query->orderBy('area', 'asc');
                break;
            case 'area_desc':
                $query->orderBy('area', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        // 9. Lấy tất cả hoặc phân trang (Hỗ trợ tương thích ngược cho Trang chủ)
        if ($request->query('all') === 'true' || (!$request->has('page') && !$request->has('admin') && !$request->has('per_page'))) {
            $properties = $query->get();
            $this->formatPriceTexts($properties);
            return response()->json($properties);
        }

        $perPage = (int) $request->input('per_page', 12);
        $paginated = $query->paginate($perPage);
        $this->formatPriceTexts($paginated->items());

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        ]);
    }

    /**
     * Thống kê số lượng BĐS nhanh (Dashboard cards)
     */
    public function stats(): JsonResponse
    {
        $total = Property::count();
        $active = Property::where('status', 1)->count();
        $sold = Property::where('status', 2)->count();
        $pending = Property::where('status', 0)->count();
        $hidden = Property::where('status', 4)->count();
        $trash = Property::onlyTrashed()->count();
        $totalValue = (float) Property::where('status', '!=', 4)->sum('price');

        return response()->json([
            'total' => $total,
            'active' => $active,
            'sold' => $sold,
            'pending' => $pending,
            'hidden' => $hidden,
            'trash' => $trash,
            'total_value' => $totalValue,
            'total_value_text' => $this->formatMoney($totalValue),
        ]);
    }

    /**
     * Xem chi tiết 1 BĐS
     */
    public function show($id): JsonResponse
    {
        $property = Property::withTrashed()
            ->with(['user', 'propertyType', 'images', 'appointments'])
            ->find($id);

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm hoặc URL không hợp lệ!'
            ], 404);
        }

        $this->formatSinglePrice($property);

        return response()->json([
            'success' => true,
            'data' => $property
        ]);
    }

    /**
     * Thêm mới BĐS (Validate theo Chương 6 Báo cáo)
     */
    public function store(Request $request): JsonResponse
    {
        // Kiểm tra khoảng trắng đầu cuối
        $title = trim($request->input('title', ''));
        if (empty($title)) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập tên sản phẩm. / Tên không được để trống.'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'area' => 'required|numeric|min:0',
            'address' => 'required|string|max:255',
            'purpose' => 'nullable|in:sale,rent,project',
            'type' => 'nullable|string|max:100',
            'property_type_id' => 'nullable|integer',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'floors' => 'nullable|integer|min:0',
            'direction' => 'nullable|string|max:50',
            'legal_status' => 'nullable|string|max:100',
            'build_year' => 'nullable|integer',
            'city' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'owner_name' => 'nullable|string|max:255',
            'owner_phone' => 'nullable|string|max:50',
        ], [
            'title.required' => 'Vui lòng nhập tên sản phẩm.',
            'title.max' => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'price.required' => 'Vui lòng nhập giá.',
            'price.numeric' => 'Giá sản phẩm phải là một số.',
            'price.min' => 'Giá sản phẩm không được là số âm.',
            'area.required' => 'Vui lòng nhập diện tích.',
            'area.numeric' => 'Diện tích phải là một số hợp lệ.',
            'area.min' => 'Diện tích không được là số âm.',
            'address.required' => 'Vui lòng nhập địa chỉ tài sản.',
            'address.max' => 'Địa chỉ không được vượt quá 255 ký tự.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Tự động sinh mã BĐS nếu trống
        $code = $request->input('code');
        if (empty($code)) {
            $prefix = strtoupper(substr($request->input('purpose', 'BDS'), 0, 3));
            $code = $prefix . '-' . strtoupper(Str::random(4)) . '-' . rand(100, 999);
        }

        // Kiểm tra trùng lặp mã code
        if (Property::withTrashed()->where('code', $code)->exists()) {
            $code .= '-' . rand(10, 99);
        }

        // Lấy thông tin user đăng
        $authUser = auth('sanctum')->user() ?? auth()->user() ?? User::where('role_id', 1)->first();

        $price = (float) $request->input('price');
        $purpose = $request->input('purpose', 'sale');

        $priceSale = ($purpose === 'sale' || $purpose === 'project') ? $price : null;
        $priceRent = ($purpose === 'rent') ? $price : null;

        $priceSaleText = $priceSale ? $this->formatMoney($priceSale) : null;
        $priceRentText = $priceRent ? ($this->formatMoney($priceRent) . '/tháng') : null;

        $property = Property::create([
            'code' => $code,
            'user_id' => $authUser ? $authUser->id : 1,
            'property_type_id' => $request->input('property_type_id', 1),
            'title' => $title,
            'description' => $request->input('description', ''),
            'price' => $price,
            'area' => (float) $request->input('area'),
            'address' => $request->input('address'),
            'province_id' => $request->input('province_id', 1),
            'district_id' => $request->input('district_id', 1),
            'ward_id' => $request->input('ward_id', 1),
            'bedrooms' => (int) $request->input('bedrooms', 1),
            'bathrooms' => (int) $request->input('bathrooms', 1),
            'floors' => (int) $request->input('floors', 1),
            'direction' => $request->input('direction', 'Đông Nam'),
            'legal_status' => $request->input('legal_status', 'Sổ hồng'),
            'build_year' => $request->input('build_year', (int) date('Y')),
            'amenities' => is_array($request->input('amenities')) ? implode(', ', $request->input('amenities')) : $request->input('amenities', ''),
            'status' => $request->input('status', 1), // Mặc định 1: Đang hiển thị
            'expire_date' => now()->addDays(30),
            'project' => $request->input('project', ''),
            'developer' => $request->input('developer', ''),
            'purpose' => $purpose,
            'type' => $request->input('type', 'Căn hộ cao cấp'),
            'price_sale' => $priceSale,
            'price_sale_text' => $priceSaleText,
            'price_rent' => $priceRent,
            'price_rent_text' => $priceRentText,
            'city' => $request->input('city', 'TP. Hồ Chí Minh'),
            'district' => $request->input('district', 'Quận 1'),
            'street' => $request->input('street', ''),
            'image' => $request->input('image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'),
            'badge' => $purpose === 'sale' ? 'Đang bán' : ($purpose === 'rent' ? 'Cho thuê' : 'Dự án mới'),
            'badge_class' => $purpose === 'sale' ? 'bg-red-500' : 'bg-emerald-500',
            'owner_name' => $request->input('owner_name', $authUser ? $authUser->name : 'Chủ sở hữu'),
            'owner_phone' => $request->input('owner_phone', $authUser ? $authUser->phone : '0901234567'),
            'lat' => $request->input('lat', 10.7769),
            'lng' => $request->input('lng', 106.7009),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm mới bất động sản thành công!',
            'data' => $property
        ], 201);
    }

    /**
     * Cập nhật BĐS
     */
    public function update(Request $request, $id): JsonResponse
    {
        $property = Property::find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm hoặc URL không hợp lệ!'
            ], 404);
        }

        $title = trim($request->input('title', $property->title));
        if (empty($title)) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập tên sản phẩm. / Tên không được để trống.'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'area' => 'sometimes|required|numeric|min:0',
            'address' => 'sometimes|required|string|max:255',
        ], [
            'title.max' => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'price.numeric' => 'Giá sản phẩm phải là một số.',
            'price.min' => 'Giá sản phẩm không được là số âm.',
            'area.numeric' => 'Diện tích phải là một số hợp lệ.',
            'area.min' => 'Diện tích không được là số âm.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['id', '_token']);
        $data['title'] = $title;

        // Nếu có giá mới, cập nhật lại text
        if (isset($data['price'])) {
            $price = (float) $data['price'];
            $purpose = $data['purpose'] ?? $property->purpose;
            if ($purpose === 'sale' || $purpose === 'project') {
                $data['price_sale'] = $price;
                $data['price_sale_text'] = $this->formatMoney($price);
            } else {
                $data['price_rent'] = $price;
                $data['price_rent_text'] = $this->formatMoney($price) . '/tháng';
            }
        }

        // Xử lý amenities nếu gửi dạng array
        if (isset($data['amenities']) && is_array($data['amenities'])) {
            $data['amenities'] = implode(', ', $data['amenities']);
        }

        // Giữ lại ảnh cũ nếu không gửi ảnh mới
        if (empty($data['image'])) {
            unset($data['image']);
        }

        $property->update($data);

        return response()->json([
            'success' => true,
            'message' => '(Cập nhật thành công, giữ lại ảnh cũ) Cập nhật sản phẩm thành công!',
            'data' => $property
        ]);
    }

    /**
     * Xóa mềm BĐS (Chuyển vào Thùng rác)
     */
    public function destroy($id): JsonResponse
    {
        $property = Property::find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Xóa không hợp lệ! Mục này có thể đã bị xóa trước đó.'
            ], 404);
        }

        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã chuyển bất động sản vào Thùng rác thành công!'
        ]);
    }

    /**
     * Danh sách BĐS trong thùng rác
     */
    public function trash(): JsonResponse
    {
        $trashed = Property::onlyTrashed()
            ->with(['user', 'propertyType'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $trashed->items(),
            'meta' => [
                'current_page' => $trashed->currentPage(),
                'last_page' => $trashed->lastPage(),
                'per_page' => $trashed->perPage(),
                'total' => $trashed->total(),
            ]
        ]);
    }

    /**
     * Khôi phục BĐS từ thùng rác
     */
    public function restore($id): JsonResponse
    {
        $property = Property::onlyTrashed()->find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Mục này không còn trong thùng rác hoặc đã được khôi phục!'
            ], 404);
        }

        $property->restore();

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục bất động sản thành công!'
        ]);
    }

    /**
     * Xóa vĩnh viễn BĐS
     */
    public function forceDelete($id): JsonResponse
    {
        $property = Property::onlyTrashed()->find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Mục này không còn trong thùng rác!'
            ], 404);
        }

        $property->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa vĩnh viễn bất động sản khỏi hệ thống!'
        ]);
    }

    /**
     * Đổi trạng thái tin (0: Chờ duyệt, 1: Đang hiển thị, 2: Đã bán/thuê, 3: Hết hạn, 4: Đã ẩn)
     */
    public function changeStatus(Request $request, $id): JsonResponse
    {
        $property = Property::find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bất động sản!'
            ], 404);
        }

        $status = (int) $request->input('status', 1);
        $property->status = $status;
        $property->save();

        $statusLabels = [
            0 => 'Chờ duyệt',
            1 => 'Đang hiển thị',
            2 => 'Đã giao dịch (Bán/Thuê)',
            3 => 'Hết hạn',
            4 => 'Đã ẩn',
        ];

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái BĐS thành: ' . ($statusLabels[$status] ?? $status),
            'data' => $property
        ]);
    }

    /**
     * Gia hạn tin đăng (Gia hạn thêm 30 ngày)
     */
    public function extend(Request $request, $id): JsonResponse
    {
        $property = Property::find($id);
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bất động sản!'
            ], 404);
        }

        $days = (int) $request->input('days', 30);
        $currentExpire = $property->expire_date ? \Carbon\Carbon::parse($property->expire_date) : now();
        if ($currentExpire->isPast()) {
            $currentExpire = now();
        }

        $property->expire_date = $currentExpire->addDays($days);
        $property->status = 1; // Kích hoạt lại nếu đang hết hạn
        $property->save();

        return response()->json([
            'success' => true,
            'message' => "Gia hạn tin đăng thêm {$days} ngày thành công! Hạn mới đến: " . $property->expire_date->format('d/m/Y'),
            'data' => $property
        ]);
    }

    /**
     * Thao tác hàng loạt (Bulk Actions: restore, force_delete, delete, change_status)
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $action = $request->input('action');
        $ids = $request->input('ids', []);

        if (empty($ids) || !is_array($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng chọn ít nhất một bất động sản để thực hiện thao tác!'
            ], 422);
        }

        switch ($action) {
            case 'restore':
                Property::onlyTrashed()->whereIn('id', $ids)->restore();
                $message = 'Khôi phục thành công các bất động sản đã chọn!';
                break;
            case 'force_delete':
                Property::onlyTrashed()->whereIn('id', $ids)->forceDelete();
                $message = 'Đã xóa vĩnh viễn các bất động sản đã chọn!';
                break;
            case 'delete':
                Property::whereIn('id', $ids)->delete();
                $message = 'Đã chuyển các bất động sản đã chọn vào Thùng rác!';
                break;
            case 'hide':
                Property::whereIn('id', $ids)->update(['status' => 4]);
                $message = 'Đã tạm ẩn các bất động sản đã chọn!';
                break;
            case 'show':
                Property::whereIn('id', $ids)->update(['status' => 1]);
                $message = 'Đã bật hiển thị các bất động sản đã chọn!';
                break;
            case 'approve':
                Property::whereIn('id', $ids)->update(['status' => 1]);
                $message = 'Đã phê duyệt các tin đăng đã chọn!';
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Hành động không hợp lệ!'
                ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }

    /**
     * Helper định dạng danh sách giá text
     */
    private function formatPriceTexts($properties): void
    {
        foreach ($properties as $item) {
            $this->formatSinglePrice($item);
        }
    }

    /**
     * Helper định dạng giá cho 1 item
     */
    private function formatSinglePrice($item): void
    {
        if (empty($item->price_sale_text) && !empty($item->price_sale)) {
            $item->price_sale_text = $this->formatMoney((float) $item->price_sale);
        }
        if (empty($item->price_rent_text) && !empty($item->price_rent)) {
            $item->price_rent_text = $this->formatMoney((float) $item->price_rent) . '/tháng';
        }
        if (empty($item->price_sale_text) && empty($item->price_rent_text) && !empty($item->price)) {
            $item->price_sale_text = $this->formatMoney((float) $item->price);
        }
    }

    /**
     * Format số tiền sang tỷ / triệu
     */
    private function formatMoney(float $amount): string
    {
        if ($amount >= 1000000000) {
            $val = round($amount / 1000000000, 2);
            return (float)$val . ' tỷ';
        } elseif ($amount >= 1000000) {
            $val = round($amount / 1000000, 1);
            return (float)$val . ' triệu';
        }
        return number_format($amount, 0, ',', '.') . ' VNĐ';
    }
}
