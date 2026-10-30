<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Danh sách danh mục với bộ lọc, tìm kiếm và phân trang
     */
    public function index(Request $request)
    {
        // 1. Tự động khởi tạo dữ liệu mẫu nếu bảng categories trống
        $this->ensureDefaultCategories();

        $query = Category::query();

        // 2. Tìm kiếm theo ID hoặc Tên danh mục hoặc Mô tả (Giới hạn tối đa 250 ký tự)
        if ($request->filled('search')) {
            $search = mb_substr(trim($request->input('search')), 0, 250);
            // Xử lý nếu người dùng gõ dạng #CAT-01 hoặc CAT-1
            $cleanId = preg_replace('/[^0-9]/', '', $search);
            
            $query->where(function ($q) use ($search, $cleanId) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
                
                if (!empty($cleanId)) {
                    $q->orWhere('id', intval($cleanId));
                }
            });
        }

        // 3. Lọc theo trạng thái
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // 4. Sắp xếp
        $sortBy = $request->input('sort_by', 'display_order');
        $sortOrder = $request->input('sort_order', 'asc');
        if (in_array($sortBy, ['id', 'name', 'display_order', 'created_at', 'status'])) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('display_order', 'asc')->orderBy('id', 'asc');
        }

        // 5. Thống kê tổng số trước phân trang
        $totalAll = Category::count();
        $totalActive = Category::where('status', 'active')->count();
        $totalInactive = Category::where('status', 'inactive')->count();

        // 6. Phân trang
        $perPage = intval($request->input('per_page', 8));
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 8;
        }

        $paginator = $query->paginate($perPage);

        // Đếm số lượng BĐS liên quan cho từng danh mục
        $items = $paginator->getCollection()->map(function ($cat) {
            $propCount = Property::where(function($q) use ($cat) {
                $q->where('type', 'like', "%{$cat->name}%")
                  ->orWhere('description', 'like', "%{$cat->name}%");
            })->count();

            $catArray = $cat->toArray();
            $catArray['properties_count'] = $propCount;
            $catArray['code'] = 'CAT-' . str_pad($cat->id, 3, '0', STR_PAD_LEFT);
            return $catArray;
        });

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'summary' => [
                'total' => $totalAll,
                'active' => $totalActive,
                'inactive' => $totalInactive,
            ]
        ]);
    }

    /**
     * Chi tiết danh mục
     */
    public function show($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy danh mục yêu cầu'
            ], 404);
        }

        $propCount = Property::where(function($q) use ($category) {
            $q->where('type', 'like', "%{$category->name}%")
              ->orWhere('description', 'like', "%{$category->name}%");
        })->count();

        $catData = $category->toArray();
        $catData['properties_count'] = $propCount;
        $catData['code'] = 'CAT-' . str_pad($category->id, 3, '0', STR_PAD_LEFT);

        return response()->json([
            'status' => 'success',
            'data' => $catData
        ]);
    }

    /**
     * Tạo danh mục mới
     */
    public function store(Request $request)
    {
        $payload = array_merge($request->all(), $request->json()->all());
        $validator = Validator::make($payload, [
            'name' => 'required|string|max:250',
            'description' => 'nullable|string|max:250',
            'status' => 'nullable|in:active,inactive',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
        ], [
            'name.required' => 'Vui lòng nhập tên danh mục',
            'name.max' => 'Tên danh mục không được vượt quá 250 ký tự',
            'description.max' => 'Mô tả danh mục không được vượt quá 250 ký tự',
            'status.in' => 'Trạng thái chỉ có thể là active hoặc inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $name = mb_substr(trim($payload['name']), 0, 250);
        // Tạo unique slug
        $baseSlug = Str::slug($name);
        if (empty($baseSlug)) {
            $baseSlug = 'danh-muc-' . time();
        }
        $slug = $baseSlug;
        $counter = 1;
        while (Category::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $maxOrder = Category::max('display_order') ?? 0;
        $order = isset($payload['display_order']) && $payload['display_order'] !== '' 
            ? intval($payload['display_order']) 
            : ($maxOrder + 1);

        $category = Category::create([
            'name' => $name,
            'slug' => $slug,
            'description' => mb_substr($payload['description'] ?? '', 0, 250),
            'status' => $payload['status'] ?? 'active',
            'icon' => $payload['icon'] ?? 'Building2',
            'display_order' => $order,
        ]);

        $catData = $category->toArray();
        $catData['properties_count'] = 0;
        $catData['code'] = 'CAT-' . str_pad($category->id, 3, '0', STR_PAD_LEFT);

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm danh mục mới thành công!',
            'data' => $catData
        ], 201);
    }

    /**
     * Cập nhật danh mục
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy danh mục cần cập nhật'
            ], 404);
        }

        $payload = array_merge($request->all(), $request->json()->all());
        $validator = Validator::make($payload, [
            'name' => 'required|string|max:250',
            'description' => 'nullable|string|max:250',
            'status' => 'nullable|in:active,inactive',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
        ], [
            'name.required' => 'Vui lòng nhập tên danh mục',
            'name.max' => 'Tên danh mục không được vượt quá 250 ký tự',
            'description.max' => 'Mô tả danh mục không được vượt quá 250 ký tự',
            'status.in' => 'Trạng thái chỉ có thể là active hoặc inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $newName = mb_substr(trim($payload['name']), 0, 250);
        if ($newName !== $category->name) {
            $baseSlug = Str::slug($newName);
            if (empty($baseSlug)) {
                $baseSlug = 'danh-muc-' . time();
            }
            $slug = $baseSlug;
            $counter = 1;
            while (Category::withTrashed()->where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $category->slug = $slug;
        }

        $category->name = $newName;
        if (array_key_exists('description', $payload)) {
            $category->description = mb_substr($payload['description'] ?? '', 0, 250);
        }
        if (array_key_exists('status', $payload)) {
            $category->status = $payload['status'] ?? 'active';
        }
        if (array_key_exists('icon', $payload)) {
            $category->icon = $payload['icon'] ?? 'Building2';
        }
        if (array_key_exists('display_order', $payload)) {
            $category->display_order = intval($payload['display_order']);
        }

        $category->save();

        $propCount = Property::where(function($q) use ($category) {
            $q->where('type', 'like', "%{$category->name}%")
              ->orWhere('description', 'like', "%{$category->name}%");
        })->count();

        $catData = $category->toArray();
        $catData['properties_count'] = $propCount;
        $catData['code'] = 'CAT-' . str_pad($category->id, 3, '0', STR_PAD_LEFT);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật danh mục thành công!',
            'data' => $catData
        ]);
    }

    /**
     * Chuyển đổi nhanh trạng thái active/inactive
     */
    public function toggleStatus($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        $category->status = $category->status === 'active' ? 'inactive' : 'active';
        $category->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã thay đổi trạng thái danh mục thành công!',
            'data' => [
                'id' => $category->id,
                'status' => $category->status
            ]
        ]);
    }

    /**
     * Xóa danh mục
     */
    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy danh mục cần xóa'
            ], 404);
        }

        $categoryName = $category->name;
        // Thực hiện xóa (soft delete)
        $category->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Đã xóa danh mục '{$categoryName}' thành công!"
        ]);
    }

    /**
     * Khởi tạo danh mục mặc định chuẩn BĐS nếu bảng chưa có dữ liệu
     */
    private function ensureDefaultCategories()
    {
        if (Category::count() === 0) {
            $defaults = [
                [
                    'name' => 'Căn hộ chung cư',
                    'slug' => 'can-ho-chung-cu',
                    'description' => 'Căn hộ cao cấp, chung cư dịch vụ, officetel và studio tiện nghi tại các đô thị lớn.',
                    'status' => 'active',
                    'icon' => 'Building2',
                    'display_order' => 1,
                ],
                [
                    'name' => 'Nhà phố liền kề',
                    'slug' => 'nha-pho-lien-ke',
                    'description' => 'Nhà phố thương mại, nhà riêng, nhà liền kề mặt tiền đường lớn thuận tiện kinh doanh.',
                    'status' => 'active',
                    'icon' => 'Home',
                    'display_order' => 2,
                ],
                [
                    'name' => 'Biệt thự nghỉ dưỡng',
                    'slug' => 'biet-thu-nghi-duong',
                    'description' => 'Biệt thự đơn lập, song lập sinh thái, biệt thự ven sông với không gian sống biệt lập đẳng cấp.',
                    'status' => 'active',
                    'icon' => 'Castle',
                    'display_order' => 3,
                ],
                [
                    'name' => 'Shophouse thương mại',
                    'slug' => 'shophouse-thuong-mai',
                    'description' => 'Mặt bằng nhà phố thương mại khối đế chung cư, vị trí đắc địa kinh doanh sầm uất.',
                    'status' => 'active',
                    'icon' => 'Store',
                    'display_order' => 4,
                ],
                [
                    'name' => 'Đất nền dự án',
                    'slug' => 'dat-nen-du-an',
                    'description' => 'Đất nền phân lô quy hoạch đồng bộ, sổ đỏ pháp lý minh bạch sẵn sàng bàn giao.',
                    'status' => 'active',
                    'icon' => 'LandPlot',
                    'display_order' => 5,
                ],
                [
                    'name' => 'Văn phòng cho thuê',
                    'slug' => 'van-phong-cho-thue',
                    'description' => 'Mặt bằng văn phòng hạng A/B, sàn thương mại và không gian làm việc chia sẻ hiện đại.',
                    'status' => 'active',
                    'icon' => 'Briefcase',
                    'display_order' => 6,
                ],
                [
                    'name' => 'Phòng trọ sinh viên',
                    'slug' => 'phong-tro-sinh-vien',
                    'description' => 'Căn hộ mini, phòng trọ cao cấp khép kín đầy đủ tiện nghi với mức giá thuê hợp lý.',
                    'status' => 'inactive',
                    'icon' => 'Key',
                    'display_order' => 7,
                ],
                [
                    'name' => 'Bất động sản công nghiệp',
                    'slug' => 'bat-dong-san-cong-nghiep',
                    'description' => 'Kho bãi, nhà xưởng tiêu chuẩn và đất khu công nghiệp trọng điểm.',
                    'status' => 'active',
                    'icon' => 'Factory',
                    'display_order' => 8,
                ],
            ];

            foreach ($defaults as $item) {
                Category::create($item);
            }
        }
    }
}
