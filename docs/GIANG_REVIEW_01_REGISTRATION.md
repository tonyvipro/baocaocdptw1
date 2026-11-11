# Mục 1/16 — Đăng ký tài khoản

Ngày kiểm tra: 10/11/2026. Phạm vi lấy theo danh sách 16 chức năng trong `docs/INPUT_AND_CONCURRENCY_AUDIT.md`; chỉ sửa mục Đăng ký trong đợt này.

## Database thực tế

| Cách chạy | Kết nối xác minh | Kết quả |
| --- | --- | --- |
| PHP CLI Windows | `backend/.env`: `DB_CONNECTION=sqlite`; `config/database.php` dùng biến môi trường; `php artisan about`, `php artisan db:show --database=sqlite` | Laravel 13.32.0, PHP 8.5.0; SQLite 3.49.2 tại `C:\wamp64\www\baocaocdptw1\backend\database.sqlite`, 33 bảng. |
| Backend Docker phục vụ cổng 8080 | `docker compose ps`, `docker compose exec -T backend php artisan db:show`, truy vấn Schema/DB chỉ đọc | MySQL 8.0.46, host `db:3306`, database `baocaocdptw1_db`, 76 bảng. Có `users`, `roles`, `personal_access_tokens`; role ID 5 là `Customer`. PHP chạy kiểm thử trong container là 8.4.27. |
| Frontend Vite | `frontend/vite.config.js` | Các request `/api` chuyển tới `http://localhost:8080`, tức backend Docker đang dùng MySQL trong phiên kiểm tra này. |
| Kiểm thử tự động | `backend/phpunit.xml`, `backend/tests/TestCase.php` | Ép `sqlite` / `:memory:`; TestCase từ chối chạy nếu cấu hình khác. Không dùng dữ liệu ứng dụng. |

Không chạy migration, seeder, đổi `.env`, `migrate:fresh` hoặc `db:wipe` trên database ứng dụng. Chỉ dùng `migrate --pretend` để xem SQL của migration token sẵn có.

## Đối chiếu chuỗi xử lý

| Tầng | File / hành vi | Kết luận |
| --- | --- | --- |
| Component | `frontend/src/components/AuthModal.jsx`: `handleRegister` gửi `name`, `email`, `phone`, `password`, `password_confirmation`. | Tên trường khớp backend; frontend đã kiểm tra xác nhận mật khẩu, giới hạn trường và SĐT. Không cần sửa JSX. |
| Service frontend | `frontend/src/services/api.js`: `registerUser` gọi `POST /api/register`, dùng `response.data` và thông báo lỗi API. | URL và cấu trúc phản hồi khớp. Giữ nguyên service. |
| Route | Trước đây `POST /api/register` khai báo trong `routes/web.php`. Nay khai báo một lần trong `routes/api.php` là `POST /register`. | Đặt route đúng nhóm API; giữ URL công khai hiện tại. |
| Middleware | API có Sanctum stateful middleware; route đăng ký bổ sung nhóm `web` để tiếp tục dùng cookie/session. Middleware toàn cục kiểm tra chính sách nhập liệu. | Đăng ký là endpoint công khai nên không yêu cầu `auth:sanctum` hoặc quyền Admin. Đã xác minh middleware thực tế bằng `route:list -vv` trên Windows và Docker. |
| Controller / FormRequest | Trước đây validation trong `AuthController::register`; `unique` kiểm tra email gốc, sau đó mới chuyển email về chữ thường khi lưu. | Có thể qua validation rồi lỗi unique 500 trên SQLite. `RegisterUserRequest` chuẩn hóa email trước validation và giữ thông báo JSON tiếng Việt. Controller chỉ điều phối service, đăng nhập và trả kết quả. |
| Service / model / relationship | `RegisterUserService` dùng `Role::CUSTOMER_ID`, quan hệ `Role::users()` và `User::role()`. `User` có `HasApiTokens`, cast mật khẩu và cờ boolean. | Tạo role mặc định nếu cần, user và token trong cùng `DB::transaction`. Chỉ lấy dữ liệu đã validate; quyền và trạng thái do server gán. Chỉ đăng nhập sau khi transaction thành công; regenerate session. |
| Migration | `0001_01_01_000001_create_roles_table.php`, `0001_01_01_000004_create_users_table.php`, `2026_10_09_002159_create_personal_access_tokens_table.php`. | Cột, quan hệ role và bảng token khớp luồng đăng ký trên MySQL thực tế. Không cần migration mới. Mã sửa dùng Eloquent/query builder, không thêm SQL riêng SQLite/MySQL. |

## Nguyên nhân và cách sửa

1. Email được chuẩn hóa sau bước kiểm tra trùng: đăng ký lại bằng email khác chữ hoa/thường trả 500 trên SQLite. Chuẩn hóa trước validation để trả 422 với lỗi trường `email`.
2. User được lưu và đăng nhập trước khi tạo token; lỗi tạo token để lại tài khoản dù frontend báo thất bại. Gom thao tác database trong transaction và chỉ đăng nhập sau khi tạo token thành công.
3. Validation nằm trong controller và mã quyền Customer là số trực tiếp. Tách FormRequest/service, dùng hằng số và relationship hiện có.
4. Route đăng ký nằm ở `web.php`. Chuyển riêng route này sang `api.php`, giữ middleware session và hợp đồng API hiện tại.

Hai lỗi đầu đã được tái hiện bằng kiểm thử thất bại trước khi sửa.

## File thay đổi

- `backend/app/Http/Controllers/AuthController.php`: chỉ thay phần đăng ký và import liên quan.
- `backend/app/Http/Requests/RegisterUserRequest.php`: mới; chuẩn hóa email, validation và thông báo lỗi.
- `backend/app/Services/RegisterUserService.php`: mới; transaction tạo Customer/user/token.
- `backend/app/Models/Role.php`: thêm hằng `CUSTOMER_ID`.
- `backend/routes/api.php`: khai báo route đăng ký.
- `backend/routes/web.php`: bỏ khai báo đăng ký cũ; sau phản hồi IDE đánh dấu đỏ, bổ sung import `Illuminate\Support\Facades\DB` còn thiếu cho lời gọi `DB::connection()` đã có sẵn ở cuối file. Không đổi hành vi endpoint đó.
- `backend/tests/Feature/RegistrationValidationTest.php`: bổ sung hồi quy email trùng khác hoa/thường, mật khẩu băm, chống tự nâng quyền, xác thực bằng token sau khi bỏ session và rollback khi tạo token lỗi.
- `docs/GIANG_REVIEW_01_REGISTRATION.md`: báo cáo này.

Migration mới: **không có**.

## Kiểm thử

Từ thư mục `backend`:

```powershell
php vendor/phpunit/phpunit/phpunit --filter='RegistrationValidationTest|AuthIdentityTest|ManagementAuditTest'
php artisan route:list --path=api/register -vv
```

Kết quả Windows: **26 test, 244 assertion đạt**. Các suite identity/management được chạy để kiểm tra hồi quy xác thực, không sửa các chức năng đó.

Từ thư mục gốc:

```powershell
docker compose exec -T backend php vendor/phpunit/phpunit/phpunit --filter=RegistrationValidationTest
docker compose exec -T backend php artisan route:list --path=api/register -vv
```

Kết quả Docker: **7 test, 66 assertion đạt** trên PHP 8.4.27. Kiểm thử trong container cũng dùng SQLite bộ nhớ; không phải kiểm thử ghi trên MySQL ứng dụng. MySQL chỉ được xác minh kết nối và cấu trúc bằng thao tác đọc.

Từ thư mục `frontend`:

```powershell
npm.cmd run test:input-policy
npm.cmd run test:auth-session
```

Hai suite frontend đạt. `git diff --check` đạt. Không thay frontend hoặc chạy build lại.

## Các bước kiểm tra thủ công trên giao diện

Các bước sau dành cho người duyệt; chưa thực hiện trực tiếp trên trình duyệt trong đợt này:

1. Mở `http://localhost:3001`, chọn Đăng ký. Dùng email mới, tên có dấu, SĐT 10 hoặc 11 số và mật khẩu 8–32 ký tự có xác nhận đúng. Mong đợi thông báo thành công và tự đăng nhập bằng tài khoản Customer; tải lại trang vẫn nhận đúng tài khoản.
2. Đăng xuất. Đăng ký lại email ở bước 1 với cách viết chữ hoa/thường khác. Mong đợi thông báo email trùng; Network trả 422 có lỗi trường `email`, không trả 500 và không tạo thêm user/token.
3. Thử SĐT 9 số, mật khẩu ngắn, xác nhận không khớp. Mong đợi bị chặn và có thông báo phù hợp. Để trống SĐT rồi đăng ký với email mới vẫn hợp lệ.
4. Kiểm tra tài khoản mới không có quyền Admin. Thử gửi thêm `role_id=1` bằng công cụ API chỉ trong môi trường kiểm thử: phản hồi vẫn có `user.role_id=5`.
5. Tình huống tạo token lỗi đã được kiểm thử tự động trên SQLite bộ nhớ. Không xóa bảng token của database ứng dụng để thử thủ công.

## Ghi chú môi trường / chưa xử lý

- SQLite local thiếu bảng `personal_access_tokens`; `migrate:status` báo tất cả migration Pending dù nhiều bảng đã tồn tại. Đăng ký thành công trên SQLite local cần bảng token; bản sửa bảo đảm rollback nếu bảng còn thiếu. Không chạy toàn bộ migrate trên database này vì lịch sử migration và cấu trúc đang lệch. Migration tạo token sẵn có đã được xem bằng `--pretend` nhưng chưa áp dụng; chưa xử lý lại lịch sử migration.
- PHP Windows báo lỗi nạp Xdebug; không cản các kiểm thử đã chạy. Docker thiếu extension `intl`, làm `db:show`/`db:table` lỗi khi định dạng sau khi đã đọc kết nối/cấu trúc. Đã xác minh lại bảng bằng Schema/DB chỉ đọc; không sửa cấu hình PHP trong mục Đăng ký.
- Chưa kiểm thử migration hoặc thao tác ghi trên MySQL; chưa kiểm tra giao diện trực tiếp. Không sửa module của thành viên khác.

Chờ xác nhận của người dùng trước khi chuyển mục 2 — Đăng nhập.
