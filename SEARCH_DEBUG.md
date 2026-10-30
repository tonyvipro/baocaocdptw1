# Tìm kiếm và gỡ lỗi

## Công cụ tìm kiếm

Ô tìm kiếm hiện tại và `GET /api/properties?search=...` hỗ trợ tiếng Việt có/không dấu, không phân biệt hoa thường và nhiều từ nằm ở các trường khác nhau. Ví dụ `nguyen biet` tìm tin có “Biệt thự” trong tiêu đề và “Nguyễn” trong địa chỉ. Mỗi từ phải xuất hiện; thứ tự từ không quan trọng.

Các trường: tiêu đề, mã tin, dự án, địa chỉ, đường, quận, thành phố, chủ đầu tư, loại BĐS. API giới hạn từ khóa 250 ký tự, kiểm tra kiểu dữ liệu và coi `%`, `_` là ký tự thường. Quyền truy cập, tin ẩn, hết hạn và xóa mềm vẫn tuân theo luồng danh sách hiện tại. Dữ liệu lấy từ database; không cần dịch vụ tìm kiếm hoặc migration mới.

API hỗ trợ MySQL/MariaDB (collation Unicode) và SQLite (hàm chuẩn hóa đăng ký theo kết nối). Tìm kiếm chứa chuỗi phù hợp quy mô đồ án; khi dữ liệu lớn cần chuyển sang chỉ mục tìm kiếm chuyên dụng. Giao diện khách vẫn lọc catalog đã tải; quản trị tìm qua API có phân trang.

## Debug React

Khởi động frontend bằng `npm run dev` trong `frontend` và backend ở cổng 8080. Mở Run and Debug trong VS Code, chọn **React: Chrome localhost:3001**, nhấn F5 rồi đặt breakpoint trong `frontend/src`. Cấu hình nằm ở `.vscode/launch.json`.

## Debug PHP

Cài extension **PHP Debug** (`xdebug.php-debug`) trong VS Code. PHP chạy backend cần nạp Xdebug 3 với cấu hình trong `php.ini` tương ứng:

```ini
xdebug.mode=debug,develop
xdebug.start_with_request=trigger
xdebug.client_host=127.0.0.1
xdebug.client_port=9003
```

Khởi động lại PHP sau khi sửa cấu hình. Chọn **PHP: Listen for Xdebug**, nhấn F5, đặt breakpoint trong controller; gửi request với `?XDEBUG_TRIGGER=1` (hoặc `&XDEBUG_TRIGGER=1` nếu đã có query). Cấu hình này dành cho backend local; Docker cần host kết nối ngược và path mapping riêng.

PHP mặc định của WAMP có thể quá cũ; dự án cần PHP >= 8.3, PHPUnit hiện tại cần PHP >= 8.4. Ví dụ dùng `C:/wamp64/bin/php/php8.4.25/php.exe` thay `php` nếu PATH đang trỏ PHP 8.0.

## Truy vết API

Mỗi phản hồi `/api/*` có header `X-Request-ID`, kể cả lỗi validation và exception. Mở DevTools → Network → request → Response Headers; tìm mã này trong `backend/storage/logs/laravel.log` (hoặc kênh log đang cấu hình). Middleware ghi method, path và status cho lỗi 5xx, không ghi body, mật khẩu hoặc token. Exception được chuyển cho bộ xử lý lỗi Laravel.

Chỉ khi `APP_ENV=local` và `APP_DEBUG=true`, API bổ sung `Server-Timing` để xem thời gian xử lý. Môi trường công khai dùng `APP_DEBUG=false`; sau khi đổi env đã cache, chạy `php artisan config:clear`. Không bật debug công khai.

## Kiểm tra

```powershell
# Từ thư mục gốc; kiểm thử DB chỉ dùng SQLite :memory:
cd backend
C:/wamp64/bin/php/php8.4.25/php.exe vendor/phpunit/phpunit/phpunit --filter AdminPropertyListingTest
cd ../frontend
node tests/search-engine.test.mjs
# Kiểm tra chỉ đọc trên API MySQL đang chạy:
node tests/search-engine.test.mjs --live
npm run build
```

Nếu dùng frontend Docker tại cổng 3000, chạy `docker compose up -d --build frontend` từ thư mục gốc để container nhận bundle mới. Build vào `frontend/dist` không tự cập nhật container Nginx đang chạy.
