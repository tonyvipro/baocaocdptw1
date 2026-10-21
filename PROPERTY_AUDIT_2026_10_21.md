# Rà soát 20 chức năng bất động sản — 21/10/2026

## Kết quả và phạm vi

Đã tìm và sửa các lỗi dưới đây trong mã nguồn. Các ca ghi dữ liệu backend chạy trên SQLite `:memory:` có chốt từ chối database khác. Kiểm tra SQL trực tiếp bằng `DB::table()->update()` trong database thử nghiệm để bỏ qua Eloquent, mô phỏng sửa bằng phpMyAdmin. MySQL `baocaocdptw1_db` được kiểm tra chỉ đọc; không xóa, đổi giá hoặc đổi trạng thái tin thật.

Chrome dùng frontend kiểm thử riêng ở cổng 3101 và API mô phỏng cho thao tác quản trị. Kiểm tra HTTP thật gọi API ở cổng 8080, không gửi yêu cầu ghi dữ liệu. Không dùng tài khoản giả để ghi vào API thật.

## Các nhóm lỗi đã sửa

| Lỗi tái hiện / tình huống thầy có thể thử | Bản sửa |
| --- | --- |
| Chưa đăng nhập vẫn gọi được `/api/properties?admin=1`, thấy cả tin ẩn/chờ duyệt; môi giới thấy tin người khác | API bắt buộc tài khoản Admin/Môi giới hoạt động; môi giới chỉ đọc tin của mình. Có test khách, Customer, Broker. |
| Sửa `properties.price` bằng SQL rồi chỉ sửa tiêu đề qua API: giá bị ghi đè bằng `price_sale` cũ | Cột `price` được ưu tiên khi cập nhật; bộ lọc frontend cũng ưu tiên giá chính. |
| Một số trường được API cho nhập 255 ký tự nhưng MySQL chỉ chứa 50/100; tiền cọc vượt DECIMAL | Validation khớp độ dài các cột direction, owner_phone, city, district, legal... và giới hạn tiền cọc; tiêu đề rỗng khi sửa bị từ chối. |
| Lịch sử xem trả tên/giá từ snapshot cũ dù SQL đã thay đổi; POST lịch sử nhận tin quá hạn | Lịch sử lấy dữ liệu tin đang hiển thị hiện tại, chuẩn hóa giá; không nhận tin hết hạn. Nhật ký gốc được giữ. |
| API công khai bỏ qua price_min/max, area_min/max, sort | Dùng chung bộ lọc cho API công khai/quản trị; kiểm tra kiểu dữ liệu, khoảng min/max và whitelist sắp xếp. |
| SQL đổi tên loại BĐS nhưng tìm kiếm/lọc vẫn dùng tên sao chép cũ trong properties | Tìm và lọc cả quan hệ propertyType theo database; vẫn hỗ trợ bản ghi cũ chưa gán ID loại. |
| Bộ lọc tự nhập chỉ có giá/diện tích tối thiểu tạo `Infinity` rồi lọc ra rỗng | Chấp nhận cận trên vô hạn, giữ kiểm tra cận dưới hợp lệ. |
| Chia sẻ trên thẻ BĐS báo đã chép khi trình duyệt từ chối clipboard | Chờ kết quả clipboard; lỗi hoặc không hỗ trợ thì hiển thị liên kết để sao chép thủ công. |
| Chi tiết tin không hiển thị description thật, tự thêm ảnh/tiện ích/số liên hệ/pháp lý mẫu; iframe bản đồ chỉ trỏ quận; thẻ luôn ghi 5 ảnh | Dùng thông tin từ dữ liệu, hiển thị chưa cập nhật khi thiếu; đếm ảnh thực tế, không tự gắn nhãn bán sổ hồng/VIP. Bản đồ ưu tiên tọa độ đã lưu rồi mới dùng địa chỉ. |
| Tin yêu thích và bảng so sánh giữ tên/giá cũ sau đồng bộ; có thể mở lại tin đã ẩn | Đối chiếu lại với catalog công khai hiện tại. Cập nhật thông tin; loại tin không còn công khai khỏi giao diện. Giữ khóa yêu thích để có thể hiện lại khi tin được mở lại. |
| Form tạo/sửa và lọc quản trị có loại BĐS viết cứng; lỗi API lại gửi lần hai sang localhost:8080 | Lấy loại đang hoạt động từ database; dùng cùng nguồn API và giữ nguyên lỗi validation, không gửi lại sang cổng khác. |
| Form gửi amenities và build_year nhưng backend loại bỏ, SQL không lưu | Thêm kiểm tra và lưu các trường này; có test tạo/sửa/đọc lại DB. |

## Đối chiếu từng chức năng

“Đạt” nghĩa là những ca dưới đây đã đạt; không có nghĩa mọi tổ hợp đầu vào hoặc mọi tình huống đồng thời đều đã được kiểm tra.

| Chức năng | Ca đã kiểm tra |
| --- | --- |
| Quản lý BĐS | Envelope data/meta, phân trang, danh sách rỗng, quyền đọc, sở hữu, thao tác hàng loạt và rollback khi có ID sai. |
| Xóa/khôi phục | Soft delete, thùng rác, restore, chặn force delete tin chưa xóa, force delete bản thử; Chrome xóa/khôi phục. |
| Phân loại BĐS | Lưu DB, slug trùng, vòng lặp cha/con, danh mục đang có tin không được xóa; SQL đổi tên; dropdown động. |
| Quản lý thông tin | Cập nhật giá/tên/ảnh/trạng thái; SQL đổi giá rồi sửa tên; giới hạn ký tự, tiền cọc và diện tích; Chrome giữ lỗi 422. |
| Tạo tin | Admin/Customer, gán người đăng từ phiên thật, 255/256 ký tự tiếng Việt, giá/diện tích sai; tiện ích và năm xây dựng được lưu. |
| Quản lý tin | Tin của tôi theo danh tính hiện tại, không theo user_id giả từ request; dữ liệu rỗng/lỗi không thay bằng dữ liệu mẫu. |
| Duyệt tin | Customer không tự duyệt; Admin duyệt/hàng loạt, tin bắt đầu xuất hiện công khai. |
| Gia hạn tin | Ngày âm/ngoài giới hạn bị chặn, cộng từ ngày hết hạn còn hiệu lực hoặc hiện tại, giữ tin ẩn/chờ duyệt; Chrome gửi 30 ngày. |
| Tìm kiếm | Có/không dấu, hoa thường, nhiều từ ở nhiều trường, mã tin, địa chỉ, tên loại sau đổi SQL; wildcard và đầu vào array/quá dài. |
| Lọc giá | Biên khoảng chuẩn và khoảng tự nhập, một cận, loại giá sai mục đích, giá thiếu/0; API thật lọc min/max. |
| Lọc diện tích | Biên 50/80/120..., dữ liệu thiếu/âm, khoảng một cận, min lớn hơn max; API thật. |
| Lọc loại BĐS | Nhóm biệt thự/căn hộ/nhà phố, tên loại database, tên loại đổi bằng SQL; loại ngừng sử dụng bị chặn khi gán. |
| Sắp xếp | Giá/diện tích tăng giảm, mới/cũ, số dạng chuỗi và giá thiếu; Chrome đổi sort, API MySQL kiểm tra bốn chiều số. |
| Trạng thái tin | 0–4, trạng thái hiệu lực khi quá hạn; ẩn/hiện đơn lẻ và hàng loạt, lịch sử; Chrome ẩn/hiện. |
| Chi tiết BĐS | Mở bằng query property, tên/giá/mô tả thật, ảnh thật, cập nhật theo catalog; đóng tin không còn công khai. |
| Bản đồ | Tọa độ hợp lệ/thiếu/sai, loại marker không hợp lệ, số marker và mobile; iframe chi tiết dùng tọa độ tin. |
| Yêu thích | Lưu localStorage, đối chiếu catalog mới, tên/giá mới, tin đã ẩn không còn trong danh sách hiển thị, localStorage lỗi. |
| So sánh | Tối đa 4, chặn tin thứ 5, cập nhật dữ liệu mới, thu gọn, chỉ khác biệt; kích thước 390/820/1365 px. |
| Chia sẻ | Liên kết mở đúng tin; clipboard bị chặn có prompt, không báo thành công giả, không có runtime exception. |
| Lịch sử xem | Không trùng cùng tin, tối đa 30 phía khách, xóa đúng mã/tất cả, dữ liệu lưu hỏng, loại tin ẩn/xóa/hết hạn, đọc dữ liệu SQL mới. |

## Bằng chứng kiểm tra

- Backend: 73 tests, 711 assertions đạt, gồm PropertyLifecycleTest, PropertyAuditTest và AdminPropertyListingTest.
- Frontend: catalog, search-engine, property-audit, numeric-input-guard và phân tích cú pháp toàn bộ source đạt.
- Chrome: bộ public `property-audit-browser.mjs` và bộ admin `property-admin-audit-browser.mjs`; mọi thao tác ghi dùng API mô phỏng.
- MySQL thật: 21/21 tin đang công khai; 0 tiêu đề/mã trống, 0 trạng thái sai, 0 diện tích không hợp lệ, 0 giá âm, 0 tọa độ sai/thiếu, 0 giá phụ/tên loại bị lệch; không có migration pending tại thời điểm kiểm tra.
- HTTP MySQL thật: quyền đọc, tin của tôi, lỗi đầu vào, giá chính, tìm mã, khoảng giá/diện tích và bốn chiều sắp xếp đạt.
- Chrome trên bản chạy thật `localhost:3000` sau cập nhật: tìm đúng mã trong 21 tin SQL, hiển thị 21 marker, tải được ô bản đồ ngoài, không có uncaught JavaScript error. Bài này chặn mọi request ghi API. Ảnh: `frontend/tests/audit-live-map.png`.
- Build production cuối thành công; còn cảnh báo kích thước bundle > 1 MB và tabSync được import theo hai cách, không phải lỗi build. Chưa tối ưu tải bundle trong lần rà soát này.

Script và ảnh: `frontend/tests/property-audit*.mjs`, `frontend/tests/property-admin-audit-browser.mjs`, `frontend/tests/property-live-audit.mjs`, `frontend/tests/audit-map-mobile.png`, `frontend/tests/audit-comparison-desktop.png`; `backend/scripts/audit-property-data.php` chỉ đọc dữ liệu.

## Cách kiểm tra lại

```powershell
cd backend
C:/wamp64/bin/php/php8.4.25/php.exe -d xdebug.mode=off vendor/phpunit/phpunit/phpunit tests/Feature
cd ../frontend
npm run test:catalog
npm run test:search
npm run test:property-audit
npm run test:property-audit:live
npm run build
```

Để chạy Chrome: cài công cụ bằng `npm install --prefix node_modules/.audit-browser --no-package-lock --ignore-scripts --no-audit --no-fund playwright`; chạy frontend nguồn trên cổng 3101, sau đó `npm run test:property-audit:browser` và `npm run test:property-audit:admin`. Có thể đặt `AUDIT_BASE_URL` và `PLAYWRIGHT_MODULE`. Các script Chrome cũ gắn tên bundle đã minify không được dùng làm bằng chứng cho bản nguồn hiện tại.

Đối chiếu MySQL: từ thư mục gốc chạy `docker exec baocaocdptw1_backend php scripts/audit-property-data.php`. Lệnh này không migrate/seed hay sửa tin.

## Giới hạn còn lại

- Chưa chạy ghi/xóa thật qua Chrome vào MySQL của người dùng. Vòng đời ghi được kiểm tra trên SQLite; MySQL đang chạy chỉ được đọc.
- Chưa kiểm tra cạnh tranh cập nhật đồng thời, dữ liệu hàng trăm nghìn tin hoặc kiểm thử tải. Tìm kiếm chứa chuỗi hiện tại phù hợp dữ liệu đồ án, chưa dùng search index chuyên dụng.
- Bài bản đồ với fixture mô phỏng tài nguyên ngoài; bài smoke thật đã xác nhận OSM tải được ở thời điểm thử. Chưa chứng nhận độ chính xác geocoding địa chỉ hoặc mọi tình huống mạng với Google Maps/OpenStreetMap.
- SQL có thể bỏ qua validation ứng dụng. Nếu sửa trực tiếp thành dữ liệu không hợp lệ, phải kiểm tra constraint/kiểu cột; các ca đang kiểm tra mô phỏng chỉnh sửa hợp lệ và một số biên lỗi, không phải mọi kiểu phá dữ liệu.
- Đã nạp bundle mới vào container frontend đang chạy ở cổng 3000 và kiểm tra lại bằng Chrome. Khi tạo lại container hoặc triển khai máy khác, dùng `docker compose up -d --build frontend` để image nhận mã nguồn mới; bản sao bundle vào container hiện tại không tự thay đổi image. Không cần migration mới cho các bản sửa ở lần rà soát này.
