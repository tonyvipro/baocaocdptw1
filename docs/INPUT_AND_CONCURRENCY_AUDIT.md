# Rà soát nhập liệu, ảnh và cập nhật đồng thời — 27/10/2026

## Kết quả

- 12 tin mẫu bị thiếu ảnh hoặc dùng URL Unsplash hỏng được bổ sung ảnh minh họa cục bộ. Seeder chỉ sửa danh sách mã tin mẫu đã xác định; giữ nguyên ảnh người dùng tải lên. Thẻ tin ghi rõ **Ảnh minh họa**.
- Đã kiểm tra HTTP cho 47 tin công khai, sử dụng 15 tệp ảnh khác nhau: ảnh đều trả HTTP 200 và Content-Type ảnh trên localhost:3000 và localhost:3001.
- Giới hạn chung cho dữ liệu văn bản người dùng nhập: tối đa 250 ký tự, bao gồm ô tìm kiếm và trường lồng trong JSON. Các giới hạn ngắn hơn vẫn áp dụng (ví dụ mật khẩu mới 8–32 ký tự, mã định danh 50 ký tự). File tải lên và dữ liệu ảnh nhị phân được kiểm tra riêng.
- Email phải có tên người nhận, `@`, tên miền và phần mở rộng hợp lệ. Hỗ trợ Gmail, iCloud và tên miền doanh nghiệp; không giới hạn riêng Gmail, không yêu cầu DNS để tránh từ chối địa chỉ khi mất mạng.
- SĐT không bắt buộc được để trống; nếu nhập phải có đúng 10–11 chữ số ASCII. Giao diện loại chữ/dấu khi nhập; API từ chối chuỗi không hợp lệ và SĐT gửi dưới dạng số (để giữ số 0 đầu).
- Các trường nội dung từ chối thẻ HTML, script và một số mẫu câu lệnh can thiệp dữ liệu rõ ràng. Mật khẩu được băm và không bị lọc ký tự đặc biệt như văn bản thông thường. Bộ lọc này bổ sung cho truy vấn có tham số và việc React escape nội dung; không thay thế chúng.

## Phạm vi 16 chức năng

| Chức năng | Kiểm tra và thay đổi chính |
| --- | --- |
| Đăng ký | Tên/email/SĐT/mật khẩu được kiểm tra tại API; tài khoản mới luôn có vai trò khách hàng (5), bỏ qua role_id do client gửi. |
| Đăng nhập | Chỉ chấp nhận mật khẩu đã băm trong DB; bỏ mật khẩu Admin dự phòng và việc tự tạo Admin khi đăng nhập. Email được tra cứu đúng tài khoản; vẫn hỗ trợ bí danh `admin`, `administrator`. |
| Hồ sơ | Tải hồ sơ mới khi mở biểu mẫu; yêu cầu version khi lưu; chỉ thông báo thành công sau khi API xác nhận. |
| Mật khẩu | Kiểm tra mật khẩu hiện tại, xác nhận mật khẩu mới và version; logout thu hồi bearer token đang dùng nếu có. |
| Phân quyền | API chỉ cho Admin; gán quyền yêu cầu version; không cho hạ quyền Admin hoạt động cuối cùng. |
| Dashboard | API yêu cầu Admin, truy vấn dữ liệu thực; đã kiểm tra trên MySQL Docker. |
| Người dùng | API chỉ cho Admin; email hỗ trợ nhiều tên miền; sửa/xóa yêu cầu version; không xóa/khóa Admin hoạt động cuối cùng. |
| Danh mục | Sửa, xóa và đổi trạng thái yêu cầu version; giữ nội dung văn bản thông thường có dấu nháy hoặc dấu câu. |
| Báo cáo | API yêu cầu Admin; kiểm tra loại/kỳ báo cáo, định dạng ngày và ngày kết thúc không trước ngày bắt đầu. |
| Thông báo & nhật ký | Yêu cầu đăng nhập; người không phải Admin chỉ xem nhật ký của mình; giữ liên kết điều hướng và kiểm thử hiện có. |
| Khách hàng | Giữ quyền Admin/Môi giới và phạm vi khách được phân công; kiểm tra nội dung và khóa phiên bản khi sửa/xóa. |
| Môi giới | Admin quản lý; SĐT 10–11 số; sửa/xóa yêu cầu version; phải chuyển các phân công đang mở trước khi xóa môi giới. |
| Phân công | Kiểm tra liên kết môi giới chưa bị xóa; phân công mới không chọn môi giới inactive; mã yêu cầu không trùng; không hủy phân công đã hoàn thành; cập nhật/hủy yêu cầu version. |
| Nhu cầu | Giữ kiểm tra ngân sách, loại BĐS, phạm vi khách hàng và transaction/version hiện có; xung đột trả mã STALE_VERSION. |
| Theo dõi khách hàng | Sửa/hủy/hoàn thành lịch đang chờ kiểm tra version; hoàn thành tạo đúng một tương tác; sửa cách đọc UTC để tránh lệch 7 giờ. |
| Tìm kiếm thông minh | Giữ debounce, hủy request cũ, lọc kết quả công khai và trạng thái loading/lỗi/rỗng; q quá 250 ký tự bị từ chối tại API. |

## Cập nhật từ hai tab hoặc hai trình duyệt

`users`, `categories`, `brokers`, `broker_assignments` có cột `version`, khởi tạo bằng 1. `customers` và `customer_demands` tiếp tục dùng cột version sẵn có.

1. Biểu mẫu giữ version của bản ghi tại thời điểm mở sửa.
2. API khóa hàng trong transaction và so sánh version trước khi ghi.
3. Lưu thành công tăng version. Validation thất bại không làm tăng version.
4. Phiên khác lưu bằng version cũ nhận HTTP 409 với `code: STALE_VERSION`; không ghi đè dữ liệu mới.
5. Giao diện hiển thị thông báo **Dữ liệu đã thay đổi**, chặn gửi tiếp các yêu cầu ghi và yêu cầu bấm **Tải lại dữ liệu**. Không tự lấy version mới rồi ghi lại biểu mẫu cũ.

Các thao tác thêm tương tác/lịch mới là thao tác thêm bản ghi, không ghi đè một lịch cũ. Dashboard, báo cáo và tìm kiếm là chức năng đọc.

## Triển khai

Đã chạy migration và seeder sửa ảnh trên Docker của workspace này. Khi mang thay đổi sang môi trường phát triển khác:

```powershell
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --class=RepairDemoPropertyImagesSeeder
docker compose up -d --build --no-deps frontend
```

Không cần chạy lại toàn bộ `DatabaseSeeder` để sửa ảnh. Các seeder tạo tin thuê/hóa đơn mới đã được bổ sung đường dẫn ảnh mẫu ngay khi tạo tin.

## Xác minh

- Backend: **119 test, 1.018 assertion**, dùng SQLite trong bộ test, không chạy test phá dữ liệu MySQL.
- Frontend: các suite input-policy, auth-session, customers, demands, notifications, property-media, meilisearch và search đã đạt; build Vite thành công.
- `docker compose exec backend php scripts/check-management-audit.php`: 12 API trả HTTP 200 trên MySQL/Meilisearch thực. Script dùng token tạm thời, thu hồi trong finally và không in token.
- Kiểm thử hai bearer session độc lập: phiên A lưu thành công; phiên B bị chặn khi dùng bản cũ; tải lại rồi lưu được.
- Chưa kiểm thử thao tác và bố cục trực tiếp ở 375/768/1280 px: công cụ điều khiển hiện không có trình duyệt được kết nối. Kiểm thử DOM giả lập, SSR, build và HTTP không thay thế kiểm thử trực quan trên trình duyệt.
