<?php

namespace App\Http\Controllers;

use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class PropertyTypeController extends Controller
{
    /**
     * Danh sách phân loại bất động sản (Spec Hình 11 - Phân loại BĐS)
     */
    public function index(Request $request)
    {
        try {
            $query = PropertyType::query();

            // Load parent relation if column exists
            if (Schema::hasColumn('property_types', 'parent_id')) {
                $query->with('parent:id,name');
            }

            // Count properties
            $query->withCount('properties');

            // 1. Tìm kiếm theo tên hoặc mô tả
            if ($request->filled('search')) {
                $search = trim($request->search);
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('slug', 'like', "%{$search}%");
                    if (Schema::hasColumn('property_types', 'description')) {
                        $q->orWhere('description', 'like', "%{$search}%");
                    }
                });
            }

            // 2. Lọc theo Loại cha (parent_id)
            if ($request->filled('parent_id') && $request->parent_id !== 'all' && Schema::hasColumn('property_types', 'parent_id')) {
                if ($request->parent_id === 'root') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', $request->parent_id);
                }
            }

            // 3. Lọc theo Trạng thái (status)
            if ($request->filled('status') && $request->status !== 'all' && Schema::hasColumn('property_types', 'status')) {
                $query->where('status', (int)$request->status);
            }

            // Sắp xếp
            $query->orderBy('id', 'asc');

            // Phân trang
            $perPage = (int) $request->input('per_page', 10);
            if ($request->boolean('all')) {
                $items = $query->get();
                return response()->json([
                    'status' => 'success',
                    'data' => $items,
                    'total' => $items->count(),
                ]);
            }

            $paginated = $query->paginate($perPage);

            // Danh sách danh mục cha khả dụng (dành cho dropdown bộ lọc & form tạo mới)
            $parents = PropertyType::select('id', 'name')->orderBy('name')->get();

            return response()->json([
                'status' => 'success',
                'data' => $paginated->items(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'parents' => $parents,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tạo mới một phân loại BĐS
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:property_types,slug',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:property_types,id',
            'status' => 'nullable|in:0,1',
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (PropertyType::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        if (!isset($validated['status'])) {
            $validated['status'] = 1;
        }

        $type = PropertyType::create($validated);
        if (Schema::hasColumn('property_types', 'parent_id')) {
            $type->load('parent:id,name');
        }
        $type->loadCount('properties');

        return response()->json([
            'status' => 'success',
            'message' => 'Tạo danh mục phân loại thành công!',
            'data' => $type
        ], 201);
    }

    /**
     * Chi tiết một danh mục phân loại
     */
    public function show($id)
    {
        $type = PropertyType::withCount('properties')->findOrFail($id);
        if (Schema::hasColumn('property_types', 'parent_id')) {
            $type->load('parent:id,name');
        }
        return response()->json([
            'status' => 'success',
            'data' => $type
        ]);
    }

    /**
     * Cập nhật danh mục phân loại
     */
    public function update(Request $request, $id)
    {
        $type = PropertyType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => "nullable|string|max:100|unique:property_types,slug,{$id}",
            'description' => 'nullable|string',
            'parent_id' => [
                'nullable',
                'exists:property_types,id',
                function ($attribute, $value, $fail) use ($id) {
                    if ($value == $id) {
                        $fail('Danh mục cha không thể là chính nó.');
                    }
                }
            ],
            'status' => 'nullable|in:0,1',
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (PropertyType::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        $type->update($validated);
        if (Schema::hasColumn('property_types', 'parent_id')) {
            $type->load('parent:id,name');
        }
        $type->loadCount('properties');

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật danh mục phân loại thành công!',
            'data' => $type
        ]);
    }

    /**
     * Xóa danh mục phân loại
     */
    public function destroy($id)
    {
        $type = PropertyType::withCount('properties')->findOrFail($id);

        // Kiểm tra xem có BĐS nào đang thuộc loại này không
        if ($type->properties_count > 0 && !request()->boolean('force')) {
            return response()->json([
                'status' => 'error',
                'message' => "Không thể xóa! Có {$type->properties_count} bất động sản đang thuộc danh mục này.",
                'properties_count' => $type->properties_count
            ], 422);
        }

        // Chuyển các danh mục con thành cấp gốc (parent_id = null)
        if (Schema::hasColumn('property_types', 'parent_id')) {
            PropertyType::where('parent_id', $id)->update(['parent_id' => null]);
        }

        $type->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa danh mục phân loại thành công!'
        ]);
    }
}
