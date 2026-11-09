# Tìm kiếm và gỡ lỗi

## Công cụ tìm kiếm

1. **Tìm kiếm danh sách quản trị (`GET /api/properties?search=...`)**:
   Hỗ trợ tiếng Việt có/không dấu, không phân biệt hoa thường và nhiều từ nằm ở các trường khác nhau. Ví dụ `nguyen biet` tìm tin có “Biệt thự” trong tiêu đề và “Nguyễn” trong địa chỉ. Dữ liệu truy vấn trực tiếp từ MySQL/SQLite.

2. **Tìm kiếm thông minh chuyên dụng (`GET /api/search/properties?q=...`)**:
   * Sử dụng **Elasticsearch** (thông qua Laravel Scout với Custom Engine `App\Search\ElasticsearchEngine` và client chính thức `elasticsearch/elasticsearch`).
   * Hỗ trợ tìm kiếm theo nhiều trường (`title^3`, `code^3`, `project^2`, `address`, `street`, `district`, `city`, `developer`, `type`), tìm kiếm mờ (fuzziness `AUTO`), tự động lọc trạng thái hiển thị (`status = 1` và chưa hết hạn `expires_at`).
   * Hỗ trợ chế độ tải danh mục ranked IDs (`catalog=1`) để kết hợp với các bộ lọc phía frontend React.
   * Cấu hình linh hoạt: Cho phép chuyển đổi giữa `elasticsearch` và `meilisearch` thông qua biến môi trường `SCOUT_DRIVER`.

## Cấu hình Elasticsearch với Docker

Trong `docker-compose.yml`, service Elasticsearch được cấu hình ở chế độ `single-node` với giới hạn RAM tối ưu:

```yaml
  elasticsearch:
    image: elasticsearch:8.13.4
    container_name: baocaocdptw1_elasticsearch
    restart: unless-stopped
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
    volumes:
      - es_data:/usr/share/elasticsearch/data
```

Khi chạy Docker, backend tự động kết nối qua `http://elasticsearch:9200`.

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

PHP mặc định của WAMP có thể quá cũ; dự án cần PHP >= 8.3, PHPUnit hiện tại cần PHP >= 8.4. Ví dụ dùng `C:/wamp64/bin/php/php8.4.15/php.exe` thay `php` nếu PATH đang trỏ PHP 8.0.

## Truy vết API

Mỗi phản hồi `/api/*` có header `X-Request-ID`, kể cả lỗi validation và exception. Mở DevTools → Network → request → Response Headers; tìm mã này trong `backend/storage/logs/laravel.log` (hoặc kênh log đang cấu hình). Middleware ghi method, path và status cho lỗi 5xx, không ghi body, mật khẩu hoặc token. Exception được chuyển cho bộ xử lý lỗi Laravel.

Chỉ khi `APP_ENV=local` và `APP_DEBUG=true`, API bổ sung `Server-Timing` để xem thời gian xử lý. Môi trường công khai dùng `APP_DEBUG=false`; sau khi đổi env đã cache, chạy `php artisan config:clear`. Không bật debug công khai.

## Kiểm tra

```powershell
# Từ thư mục gốc; kiểm thử Elasticsearch Scout Search
cd backend
C:/wamp64/bin/php/php8.4.15/php.exe vendor/phpunit/phpunit/phpunit tests/Feature/PropertyElasticsearchTest.php

# Kiểm thử quản lý danh sách & tìm kiếm SQL:
C:/wamp64/bin/php/php8.4.15/php.exe vendor/phpunit/phpunit/phpunit --filter AdminPropertyListingTest

# Kiểm thử frontend:
cd ../frontend
node tests/search-engine.test.mjs
# Kiểm tra chỉ đọc trên API MySQL đang chạy:
node tests/search-engine.test.mjs --live
npm run build
```

Nếu dùng frontend Docker tại cổng 3000, chạy `docker compose up -d --build frontend` từ thư mục gốc để container nhận bundle mới. Build vào `frontend/dist` không tự cập nhật container Nginx đang chạy.
