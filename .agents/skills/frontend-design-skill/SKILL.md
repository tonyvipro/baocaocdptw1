---
name: frontend-design-skill
description: >-
  Use this skill when designing, building, or refactoring frontend user interfaces
  (React, Vue, Tailwind CSS, or Laravel Blade) for real estate platforms, ensuring
  premium visual aesthetics, modern design tokens, responsive layouts, and safe
  iterative page-by-page deployment.
---

# Frontend Design Skill - Hướng Dẫn Thiết Kế & Triển Khai Giao Diện Bất Động Sản

Skill này cung cấp tiêu chuẩn thiết kế UI/UX hiện đại và quy trình phát triển an toàn cho dự án sàn giao dịch bất động sản (React / Vue kết hợp Laravel Backend).

---

## 1. Hệ Thống Thiết Kế Thẩm Mỹ Cao Cấp (Premium Design System)

Giao diện bất động sản cần tạo cảm giác sang trọng, tin cậy và chuyên nghiệp:

### 1.1. Bảng Màu (Color Palette Tokens)
* **Màu nền chính (Surface / Background):**
  - Light mode: Slate-50 (`#f8fafc`), Clean White (`#ffffff`), Subtle Gray (`#f1f5f9`).
  - Dark mode: Deep Slate (`#0b0f19`), Card Dark (`#111827`), Border (`#1e293b`).
* **Màu thương hiệu & Điểm nhấn (Brand & Accents):**
  - Primary (Bất động sản / Uy tín): Xanh Navy hoàng gia (`#1e3a8a` / `#2563eb`) hoặc Đỏ đô thương hiệu (`#dc2626` / `#b91c1c`).
  - Secondary (Giá trị & Tiền tệ): Vàng kim loại / Hổ phách (`#f59e0b` / `#d97706`).
  - Success (Đã duyệt / Hoạt động): Xanh ngọc lục bảo Emerald (`#10b981` / `#059669`).
  - Danger (Thùng rác / Từ chối): Đỏ Rose (`#ef4444`).
* **Hiệu ứng thị giác:**
  - Glassmorphism: `backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20`.
  - Đổ bóng cao cấp: `shadow-sm hover:shadow-xl transition-all duration-300`.

### 1.2. Kiểu Chữ (Typography)
* Ưu tiên font tiếng Việt chuẩn: **Inter**, **Be Vietnam Pro**, hoặc **Outfit**.
* Phân cấp rõ ràng:
  - Tiêu đề Hero: 32px - 40px (Font-bold / Extrabold).
  - Tên Bất Động Sản: 18px - 20px (Font-semibold, line-clamp-2).
  - Giá bán: 18px - 22px (Font-extrabold, màu đỏ/hổ phách nổi bật).
  - Thông số kỹ thuật (Diện tích, PN, WC): 13px - 14px (Font-medium, text-slate-500).

---

## 2. Thư Viện Thành Phần Chuẩn (Component Library)

Mọi màn hình BĐS phải tái sử dụng các thành phần chuẩn sau:

1. **`PropertyCard` (Thẻ Bất Động Sản):**
   - Hình ảnh tỷ lệ chuẩn 16:9 hoặc 4:3 kèm badge trạng thái (Đang bán, Đã bán, VIP).
   - Nút yêu thích (Heart icon) dạng toggle animation.
   - Thước đo thông số (Bed, Bath, Area m²) bằng icon SVG rõ nét.
   - Hiển thị giá định dạng chuẩn Việt Nam (`tỷ`, `triệu/tháng`).
2. **`FilterBar` (Bộ Lọc Đa Năng):**
   - Tìm kiếm từ khóa theo tên/địa chỉ.
   - Dropdown chọn loại BĐS (Căn hộ, Nhà phố, Đất nền, Biệt thự).
   - Slider hoặc dropdown chọn khoảng giá và diện tích.
   - Nút Reset bộ lọc và Nút Áp dụng.
3. **`StatusBadge` (Huy Hiệu Trạng Thái):**
   - Hoạt động: Xanh lục nhẹ (`bg-emerald-50 text-emerald-700 border-emerald-200`).
   - Chờ duyệt: Vàng nhạt (`bg-amber-50 text-amber-700 border-amber-200`).
   - Đã bán: Xám trung tính (`bg-slate-100 text-slate-600`).
4. **`PropertyModal` (Xem & Sửa):**
   - Header có title và nút đóng `X`.
   - Form chia nhóm 2 cột rõ ràng (Thông tin cơ bản, Giá & Diện tích, Hình ảnh, Tiện ích).

---

## 3. Quy Trình Triển Khai An Toàn Từng Trang (Safe Deployment Workflow)

Để không làm hỏng các tính năng đang chạy, Agent và Lập trình viên phải tuân theo 4 bước:

### Bước 1: Phát triển Component độc lập (Component Isolation)
- Tạo component mới trong thư mục riêng (ví dụ `frontend/src/components/properties/`).
- Tạo sẵn dữ liệu mẫu (`mockData`) ngay bên trong component để giao diện luôn hiển thị đẹp mắt ngay cả khi Backend API đang bảo trì hoặc chưa có seeder.

### Bước 2: Tích hợp State & Error Boundary
- Dùng `useState` với 3 trạng thái bắt buộc: `isLoading`, `error`, và `data`.
- Hiển thị Skeleton Loading khi đang tải dữ liệu, không để trang bị giật layout (CLS).
- Xử lý `try...catch` khi gọi API Laravel, fallback về thông báo lỗi thân thiện thay vì làm sập trang trắng (White Screen of Death).

### Bước 3: Đăng ký Router không xung đột
- Khai báo route mới trong `App.jsx` hoặc router config.
- Không sửa đè vào route của các thành viên khác đang làm (Lịch hẹn, Tin tức, Người dùng).

### Bước 4: Kiểm tra đa thiết bị & Build xác thực
- Kiểm tra hiển thị responsive trên 3 kích thước:
  + Mobile: 375px - 414px (Single column, menu drawer).
  + Tablet: 768px - 1024px (2 columns grid).
  + Desktop: 1280px+ (3 - 4 columns grid).
- Chạy kiểm tra build static để đảm bảo không có lỗi linter/syntax trước khi đưa lên môi trường chạy.

---

## 4. Tích Hợp Với Backend Laravel (API Contract)

Đảm bảo Payload JSON giữa Frontend và Laravel Controller luôn đồng bộ:
* **Endpoints chuẩn:**
  - `GET /api/properties`: Danh sách có phân trang và bộ lọc.
  - `GET /api/properties/stats`: Số liệu thống kê dashboard.
  - `POST /api/properties`: Tạo tin đăng mới.
  - `PUT /api/properties/{id}`: Cập nhật thông tin.
  - `DELETE /api/properties/{id}`: Xóa tạm thời (Soft delete).
  - `POST /api/properties/{id}/restore`: Khôi phục từ thùng rác.
  - `DELETE /api/properties/{id}/force`: Xóa vĩnh viễn.
* **Header bắt buộc:**
  - `Accept: application/json`
  - `Content-Type: application/json`
