# 3TV Land - Báo Cáo Chuyên Đề Phát Triển Web 1

## Quản lý & Theo dõi Khách hàng

Mở mục **Quản lý khách hàng** trong dashboard hoặc truy cập `http://localhost:3001/#admin/customers` sau khi đăng nhập. Hai tab **Quản lý khách hàng** và **Theo dõi khách hàng** dùng chung dữ liệu database.

- Admin quản lý toàn bộ khách hàng và phân công người phụ trách; Broker quản lý khách hàng được giao.
- Tab Quản lý có các cột Tên khách hàng, Công ty, Email, Số điện thoại, Nhóm khách hàng, Ngày tạo, Hành động.
- Tab Theo dõi có các cột ID, Tên khách hàng, Công ty/Nguồn, Trạng thái, Lần tương tác cuối, Hoạt động tiếp theo, Người phụ trách, Hành động.
- Mỗi dòng có biểu tượng xem, sửa, xóa và cuối bảng có số lượng bản ghi/phân trang. Nút xem ở tab Theo dõi mở lịch sử tương tác và lịch chăm sóc.
- Xóa ở tab Theo dõi chỉ gỡ theo dõi. Bật lại tùy chọn Theo dõi khách hàng trong form sửa ở tab Quản lý để đưa khách hàng trở lại danh sách.
- Các ô văn bản của module giới hạn 250 ký tự; SĐT chỉ nhận 10–11 chữ số. Xóa khách hàng dùng soft delete để giữ lịch sử. Bản sửa cũ được chặn bằng kiểm tra phiên bản.

Dữ liệu CRM lưu trong `customers`, `customer_interactions`, `customer_activities`. Khi cập nhật mã nguồn ở môi trường khác, chạy migration bổ sung:

```bash
cd backend
php artisan migrate --path=database/migrations/2026_10_19_150000_create_customer_crm_tables.php
php artisan migrate --path=database/migrations/2026_10_19_160000_add_customer_tracking_flag.php
php artisan db:seed --class=CustomerSeeder
```

Với Docker, chạy các lệnh trên qua `docker compose exec backend`. Seeder lấy khách hàng từ tài khoản Customer và phân công môi giới đã seed, kèm hai hồ sơ mẫu Phạm Văn E/Lê Thị C. Chạy lại CustomerSeeder không ghi đè hồ sơ đã sửa, không khôi phục khách đã xóa/gỡ theo dõi và không đặt lại tài khoản.

Kiểm tra: `php artisan test --filter=CustomerManagementTest` trong `backend`; `npm run test:customers` trong `frontend`. Script `php scripts/check-customer-crm.php` kiểm tra bảng và truy vấn CRM trên kết nối database hiện tại bằng thao tác chỉ đọc.

Hệ thống tra cứu, so sánh và định vị bất động sản cao cấp được phát triển bằng **ReactJS** (Frontend) và **Laravel 11** (Backend API).

---

## 📁 Cấu trúc thư mục dự án

```text
baocaocdptw1/
├── frontend/               # Ứng dụng Frontend ReactJS (Vite, TailwindCSS, Leaflet)
│   ├── src/
│   │   ├── components/     # Các thành phần giao diện (Navbar, Hero, Cards, Modal, Map,...)
│   │   ├── data/           # Dữ liệu BĐS json chuẩn bị sẵn
│   │   ├── services/       # Kết nối API Backend & fallback data
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── backend/                # Ứng dụng Backend Laravel 11 API & CSDL
│   ├── app/                # Models, Controllers
│   ├── database/           # Migrations, Seeders, Data JSON
│   ├── routes/             # API routes (/api/properties, /api/run-migrate)
│   ├── Dockerfile
│   └── composer.json
│
└── docker-compose.yml      # Cấu hình Docker tự động cho toàn bộ hệ thống
```

---

## 🐳 Hướng dẫn chạy bằng Docker (Khuyên Dùng)

### 1. Khởi động toàn bộ hệ thống
Mở Terminal / PowerShell tại thư mục gốc `baocaocdptw1` và chạy lệnh:

```bash
docker compose up -d --build
```
*(Nếu dùng Docker bản cũ: `docker-compose up -d --build`)*

### 2. Các cổng dịch vụ sau khi khởi động:
- **Frontend ReactJS**: [http://localhost:3000](http://localhost:3000)
- **Backend Laravel API**: [http://localhost:8080](http://localhost:8080)
- **phpMyAdmin (Quản lý CSDL)**: [http://localhost:8081](http://localhost:8081)
  - **Tài khoản**: `root`
  - **Mật khẩu**: `rootpassword`
- **MySQL Database**: Cổng `3306`

### 3. Khởi tạo & nạp dữ liệu Database (Migrate & Seed)
Bạn có thể bấm trực tiếp nút **"Backend DB"** trên thanh Menu của giao diện Frontend React, hoặc truy cập URL:
```text
http://localhost:8080/api/run-migrate
```

### 4. Dừng hệ thống Docker:
```bash
docker compose down
```

---

## 💻 Hướng dẫn chạy thủ công (Local Development)

### 1. Chạy Frontend ReactJS:
```bash
cd frontend
npm install
npm run dev
```
Truy cập: `http://localhost:3001`. Giữ terminal này chạy trong khi sử dụng website. Vite dùng cố định cổng 3001; nếu cổng bị chiếm, chương trình sẽ báo lỗi thay vì tự đổi cổng.

Trên PowerShell, nếu `npm.ps1` bị chặn bởi Execution Policy, dùng `npm.cmd install` và `npm.cmd run dev`.

### 2. Chạy Backend Laravel:
```bash
cd backend
composer install
php artisan serve --host=127.0.0.1 --port=8080
```
Truy cập: `http://127.0.0.1:8080`. Vite chuyển tiếp các yêu cầu `/api`, `/uploads`, `/storage` tới địa chỉ này.
