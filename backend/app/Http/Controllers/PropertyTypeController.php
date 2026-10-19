<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PropertyTypeController extends Controller
{
    private function authorizeWrite(Request $request): void
    {
        abort_unless($request->user() && $request->user()->is_active, 401, 'Vui lòng đăng nhập lại.');
        abort_unless((int) $request->user()->role_id === 1, 403, 'Chỉ quản trị viên được sửa danh mục.');
    }

    public function index()
    {
        $types = PropertyType::withCount('properties')->orderBy('id')->get();
        $names = $types->pluck('name', 'id');
        $types->each(fn ($type) => $type->setAttribute('parent_name', $names[$type->parent_id] ?? null));
        return response()->json(['data' => $types])->header('Cache-Control', 'no-store');
    }

    public function save(Request $request, ?int $id = null)
    {
        $this->authorizeWrite($request);
        $type = $id ? PropertyType::findOrFail($id) : new PropertyType;
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('property_types')->ignore($id)],
            'parent_id' => 'nullable|integer|exists:property_types,id',
            'description' => 'nullable|string|max:10000', 'status' => 'required|boolean',
        ]);
        $parentId = $data['parent_id'] ?? null;
        $seen = [];
        while ($parentId) {
            abort_if($parentId == $id || isset($seen[$parentId]), 422, 'Danh mục cha tạo vòng lặp.');
            $seen[$parentId] = true;
            $parentId = PropertyType::findOrFail($parentId)->parent_id;
        }
        DB::transaction(function () use ($type, $data) {
            $oldName = $type->name;
            $type->fill($data)->save();
            if ($oldName && $oldName !== $type->name) {
                Property::withTrashed()->where('property_type_id', $type->id)->update(['type' => $type->name]);
            }
        });
        return response()->json(['data' => $type, 'message' => 'Đã lưu danh mục.'], $id ? 200 : 201);
    }

    public function destroy(Request $request, int $id)
    {
        $this->authorizeWrite($request);
        $type = PropertyType::findOrFail($id);
        abort_if(PropertyType::where('parent_id', $id)->exists() || Property::withTrashed()->where('property_type_id', $id)->exists(), 422, 'Danh mục còn danh mục con hoặc bất động sản sử dụng.');
        $type->delete();
        return response()->json(['message' => 'Đã xóa danh mục.']);
    }
}
