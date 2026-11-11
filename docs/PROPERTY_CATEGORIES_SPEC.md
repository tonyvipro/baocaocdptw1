# Đặc Tả Kỹ Thuật: Chuẩn Hóa Danh Mục Bất Động Sản (Property Categories Specification)

## 1. Mục Đích Danh Mục (Category Purpose)
Trong hệ thống sàn giao dịch 3TV Land, **Danh mục (Categories)** được xác định rõ là **Phân loại loại hình bất động sản** (ví dụ: *Căn hộ chung cư, Nhà phố liền kề, Biệt thự nghỉ dưỡng, Shophouse thương mại, Đất nền dự án, Văn phòng cho thuê, Phòng trọ sinh viên, Bất động sản công nghiệp*).

### Vai trò cốt lõi:
1. **Phân nhóm tài sản chuẩn mực**: Đóng vai trò là danh mục phân cấp chính thức (Taxonomy) thay vì các chuỗi văn bản tự do nhập liệu hoặc tìm kiếm mập mờ trong mô tả.
2. **Khóa ngoại định danh trong cơ sở dữ liệu**: Bảng `properties` liên kết trực tiếp tới `categories` thông qua trường khóa ngoại `category_id`.
3. **Thống kê & Báo cáo tỷ trọng**: Các màn hình Dashboard, Báo cáo thị trường và Quản lý danh mục thống kê số lượng BĐS dựa trên quan hệ thực `withCount('properties')` hoặc `GROUP BY category_id`, loại bỏ hoàn toàn việc quét chuỗi `LIKE '%tên danh mục%'` trong cột `description`.
4. **Trải nghiệm nhập liệu nhất quán**: Form đăng tin (người dùng ngoài) và Form quản trị viên (Admin) sử dụng chung danh sách danh mục đồng bộ từ API `/api/categories/options`.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu & Migration

### 2.1 Cột khóa ngoại `properties.category_id`
- Tên cột: `category_id`
- Kiểu dữ liệu: `unsignedBigInteger`, `nullable` ban đầu.
- Ràng buộc khóa ngoại: Liên kết tới `categories(id)`.
- Ràng buộc xóa: `onDelete('set null')` (an toàn dữ liệu khi danh mục bị xóa vật lý).
- Tương thích cơ sở dữ liệu: Được thiết kế chạy an toàn trên cả MySQL 8.0 (production/local) và SQLite trong bộ test PHPUnit bằng cơ chế bọc kiểm tra ràng buộc foreign key an toàn.

### 2.2 Chiến lược Migration dữ liệu cũ (Data Backfill)
- File migration: `backend/database/migrations/2026_11_11_000001_add_category_id_to_properties_table.php`
- Quy tắc khớp dữ liệu:
  - Quét tên danh mục trong trường `description` và `type` của từng BĐS không phân biệt hoa thường (`mb_stripos`).
  - **Chỉ gán `category_id` khi khớp DUY NHẤT 1 danh mục**.
  - **Không đoán bừa**: Nếu bản ghi khớp 0 danh mục hoặc khớp nhiều hơn 1 danh mục, hệ thống giữ nguyên `category_id = NULL` và xuất toàn bộ danh sách các bản ghi này ra file JSON phục vụ kiểm duyệt thủ công:
    `backend/storage/app/unmatched_properties_categories.json`.

---

## 3. Quan Hệ Eloquent Models

### 3.1 `App\Models\Category`
```php
public function properties()
{
    return $this->hasMany(Property::class, 'category_id');
}
```

### 3.2 `App\Models\Property`
```php
public function category()
{
    return $this->belongsTo(Category::class, 'category_id');
}
```
- Đã khai báo ép kiểu `'category_id' => 'integer'` trong `$casts`.
- Đã bổ sung trường `category_id` trong mảng tìm kiếm `toSearchableArray()` của Laravel Scout.

---

## 4. API Endpoints & Nghiệp Vụ Xóa Danh Mục

### 4.1 Danh sách danh mục: `GET /api/categories` & `GET /api/categories/{id}`
- Trả về dữ liệu danh mục cùng `properties_count` thực tế thông qua `$query->withCount('properties')`.

### 4.2 Danh sách gọn cho Dropdown: `GET /api/categories/options`
- Public endpoint trả về các danh mục đang hoạt động (`status = 'active'`) phục vụ các dropdown chọn loại hình BĐS.

### 4.3 Quy tắc bảo vệ toàn vẹn dữ liệu khi Xóa danh mục: `DELETE /api/categories/{id}`
Khi người dùng yêu cầu xóa một danh mục:
1. **Kiểm tra số BĐS trực thuộc**:
   - Nếu danh mục **không có BĐS nào** (`properties_count == 0`): Thực hiện soft delete thành công (HTTP 200).
   - Nếu danh mục **đang có BĐS trực thuộc** (`properties_count > 0`):
     - **Trường hợp không truyền `reassign_to_category_id`**: Hệ thống **CHẶN XÓA** và trả về mã lỗi HTTP 422:
       ```json
       {
         "status": "error",
         "error_code": "CATEGORY_HAS_PROPERTIES",
         "properties_count": 5,
         "message": "Không thể xóa danh mục 'Căn hộ chung cư' vì đang có 5 bất động sản trực thuộc. Vui lòng chuyển các bất động sản sang danh mục khác trước khi xóa."
       }
       ```
     - **Trường hợp có truyền `reassign_to_category_id`**:
       + Kiểm tra danh mục đích phải tồn tại và khác danh mục hiện tại.
       + Bọc trong `DB::transaction`: Cập nhật toàn bộ BĐS sang `category_id` mới (`Property::where('category_id', $id)->update(['category_id' => $reassignToId])`).
       + Xóa danh mục cũ và trả về HTTP 200 kèm số lượng BĐS đã chuyển giao.

---

## 5. Đồng Bộ Giao Diện Người Dùng (Frontend)

1. **`CategoryManagement.jsx`**:
   - Hiển thị mô tả rõ ràng: *"Danh mục loại hình BĐS dùng để phân nhóm tài sản trên sàn, liên kết trực tiếp với tin đăng BĐS và thống kê tỷ trọng báo cáo."*
   - Cột "Số lượng BĐS" hiển thị giá trị `properties_count` từ API.
   - Hộp thoại Xóa thông minh: Khi danh mục có BĐS, tự động kích hoạt chế độ cảnh báo và hiển thị dropdown chọn danh mục tiếp nhận trước khi cho phép xác nhận xóa.

2. **`PropertiesManager.jsx` (Admin)**:
   - Form Tạo mới (`CreatePropertyForm`): Dropdown "Danh mục loại hình BĐS (*)" tải danh mục từ `fetchCategoryOptions()`, lưu `category_id` và tự động cập nhật nhãn `type`.
   - Modal Chỉnh sửa (`EditPropertyModal`): Dropdown danh mục bind với `category_id` của BĐS.

3. **`PostPropertyModal.jsx` (Client)**:
   - Tích hợp dropdown danh mục động từ `fetchCategoryOptions()`, gửi `category_id` lên backend khi đăng tin.

