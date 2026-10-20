# 3TV Land - Báo Cáo Chuyên Đề Phát Triển Web 1

## Quản lý nhu cầu

Đăng nhập bằng Admin hoặc Broker và mở **Quản lý nhu cầu** trong dashboard: `http://localhost:3001/#admin/demands`.

- Tìm theo mã `ND-1001`, tên/thông tin khách hàng, loại BĐS, khu vực hoặc ghi chú. Nút **Bộ lọc** lọc loại BĐS, ngân sách VNĐ, khu vực và trạng thái. Khoảng ngân sách được lọc theo phần giao nhau, tính cả hai đầu mút.
- Nút **Thêm nhu cầu mới** chọn khách hàng CRM và loại BĐS từ database, nhập khoảng ngân sách, khu vực, trạng thái và ghi chú. Có thể tìm khách hàng theo tên, email hoặc SĐT để chọn trong danh sách được phân quyền.
- Bảng gồm ID Nhu cầu, Tên khách hàng, Loại BĐS, Ngân sách, Khu vực, Trạng thái, Ngày tạo và các nút xem/sửa/xóa. Có phân trang và tổng số bản ghi. Xóa nhu cầu không xóa khách hàng; dữ liệu nhu cầu được xóa mềm.
- Admin quản lý toàn bộ nhu cầu; Broker chỉ quản lý nhu cầu của khách hàng được phân công. Phân công lại khách hàng cũng chuyển phạm vi quản lý nhu cầu. Khách hàng đã xóa không còn xuất hiện trong danh sách nhu cầu.
- Các ô văn bản tối đa 250 ký tự; ngân sách là số nguyên VNĐ không âm, tối đa 15 chữ số và ngân sách đến phải từ ngân sách bắt đầu trở lên. Các thay đổi được ghi trong Nhật ký hoạt động và có kiểm tra phiên bản để tránh ghi đè khi cùng chỉnh sửa.

Chạy migration bổ sung trên môi trường khác trước khi sử dụng:

```bash
cd backend
php artisan migrate --path=database/migrations/2026_10_19_000001_extend_property_types_table.php
php artisan migrate --path=database/migrations/2026_10_20_120000_create_customer_demands_table.php
```

Với Docker, chạy hai lệnh trên bằng `docker compose exec backend php artisan migrate --path=...`. Migration danh mục bổ sung cột `property_types.status`; migration nhu cầu tạo bảng `customer_demands`. Danh sách ban đầu trống cho đến khi ghi nhận nhu cầu thực tế. Không cần chạy lại DatabaseSeeder.

Nếu frontend trả lỗi HTTP 500 với nội dung rỗng, kiểm tra backend tại `http://localhost:8080/up` và khởi động Docker/backend. Lỗi thiếu bảng `customer_demands` hoặc cột `property_types.status` cần chạy đủ hai migration trên. API trả thông báo 503 khi cấu trúc module còn thiếu; frontend phân biệt lỗi kết nối, lỗi HTTP và giới hạn chờ 30 giây để chịu được thời gian khởi động backend.

Kiểm tra: `php artisan test --filter=CustomerDemandTest` trong `backend`, `npm.cmd run test:demands` và `npm.cmd run build` trong `frontend`. Script `php scripts/check-customer-demands.php` kiểm tra cấu trúc và hai truy vấn API trên database hiện tại bằng thao tác chỉ đọc.

## Thông báo & Nhật ký

Bấm biểu tượng chuông trên thanh đầu trang để mở `http://localhost:3001/#notifications`. Trong dashboard Admin/Broker, dùng chuông hoặc mục **Thông báo & Nhật ký** (`#admin/notifications`). Ba liên kết Tất Cả Nhà Đất/Nhà Đất Bán/Nhà Đất Cho Thuê trên thanh điều hướng đã được gỡ; danh sách và bộ lọc bất động sản vẫn hoạt động.

- Bảng Thông báo Mới gồm Ngày, Loại thông báo, Nội dung và Trạng thái; chuông hiển thị số thông báo chưa đọc. Dữ liệu tự cập nhật mỗi 15 giây khi trang đang hiển thị.
- Thông báo lấy từ bảng `notifications`, hóa đơn đã thanh toán/quá hạn và hợp đồng còn hiệu lực sắp hết hạn trong 3 ngày. Cập nhật hồ sơ và kích hoạt hợp đồng cũng tạo thông báo. Đồng bộ lại không tạo trùng hoặc đặt lại trạng thái đã đọc.
- Nhật ký ghi thao tác thành công từ lúc triển khai: đăng nhập, đăng xuất, cập nhật hồ sơ, tạo/sửa/xóa khách hàng, tạo/sửa/xóa/kích hoạt hợp đồng; đồng thời hiển thị nhật ký bất động sản đã có. Kích hoạt hợp đồng được hiển thị là Ký hợp đồng theo luồng trạng thái hiện tại.
- Admin xem nhật ký hệ thống; tài khoản khác chỉ xem nhật ký của mình. Thông báo và nút **Đánh dấu tất cả là đã đọc** luôn thuộc tài khoản hiện tại.
- **Tải xuống Nhật ký** xuất toàn bộ nhật ký trong phạm vi quyền truy cập ra CSV UTF-8 (mở được bằng Excel), gồm cả các trang chưa mở. Ngày giờ hiển thị theo giờ Việt Nam. Không xuất mật khẩu hoặc payload hồ sơ thô.

Module dùng các bảng `notifications`, `activity_logs`, `contracts`, `invoices` đã có, không cần migration mới hoặc dữ liệu giả. Kiểm tra: `php artisan test --filter=NotificationTest` trong `backend`, `npm.cmd run test:notifications` và `npm.cmd run build` trong `frontend`.

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

Trên Windows, nhấp đúp **`start-local.cmd`** ở thư mục gốc để khởi động Vite chạy nền tại `http://localhost:3001`. Có thể đóng cửa sổ sau khi khởi động. Chạy lại file này khi khởi động lại máy; nếu website đã chạy, chương trình dùng lại tiến trình hiện tại. Nhật ký nằm ở `frontend/vite-local.log`.

Hoặc chạy từ thư mục `frontend`: `npm.cmd run start:local`.

Để chạy và xem log trực tiếp trong terminal:

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
