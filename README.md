# 3TV Land - Báo Cáo Chuyên Đề Phát Triển Web 1

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
Truy cập: `http://localhost:3000`

### 2. Chạy Backend Laravel:
```bash
cd backend
composer install
php artisan serve
```
Truy cập: `http://127.0.0.1:8000`
