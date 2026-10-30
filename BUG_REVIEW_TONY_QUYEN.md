# Rà soát chức năng Phạm Đoàn Tony Quyền — 19/10/2026

## Sửa lỗi Quản lý khách hàng — 21/10/2026

Trang `localhost:3000/#admin/customers` báo SQLSTATE[42S02] vì database Docker `baocaocdptw1_db` chưa chạy hai migration CRM. Đã chạy riêng `2026_10_19_150000_create_customer_crm_tables.php` và `2026_10_19_160000_add_customer_tracking_flag.php`, sau đó chạy `CustomerSeeder` để bổ sung hồ sơ từ dữ liệu dự án. Không reset database hoặc ghi đè hồ sơ cũ.

Kiểm tra chỉ đọc bằng `docker exec baocaocdptw1_backend php scripts/check-customer-crm.php`: database đúng `baocaocdptw1_db`, các bảng/quan hệ truy vấn OK, 5 khách hàng và 5 hồ sơ theo dõi. Bộ `CustomerManagementTest` chạy bằng PHP 8.4.25 trên SQLite `:memory:` đạt 9 tests, 132 assertions. Khi triển khai sang database khác, cần chạy hai migration CRM như hướng dẫn README.

## Sửa lỗi sau khi pull — danh mục, môi giới, so sánh và tiêu đề

Trang trắng sau khi build do `App.jsx` tham chiếu `handleLogout` chưa được khai báo. Đã khôi phục hàm đăng xuất và dọn trạng thái phiên/giao diện.

- Bổ sung migration tạo bảng `categories` còn thiếu; API trả 8 danh mục. Lệnh `php artisan brokers:sync-users` bổ sung hồ sơ từ tài khoản vai trò môi giới, không ghi đè hoặc khôi phục hồ sơ đã xóa; API hiện trả 4 hồ sơ.
- Bảng so sánh đối chiếu tối đa 4 tin theo giá, giá/m², diện tích, phòng, vị trí, pháp lý, nội thất; tô hàng khác biệt, lọc chỉ khác biệt, thu gọn giữ lựa chọn và cuộn ngang.
- Form thêm/sửa BĐS và đăng tin chặn tiêu đề quá 255 ký tự; API kiểm tra tạo/sửa và báo tiếng Việt. Có test biên 255/256 ký tự tiếng Việt.
- Source quản trị đã được pull đầy đủ; đã production build bằng Node 20 trong Docker. Các ghi chú bên dưới về source quản trị bị thiếu mô tả trạng thái cũ.
- Sự cố kiểm thử: Docker giữ kết nối MySQL từ môi trường/cấu hình cache, làm rỗng database khi chạy test. Đã phục hồi binlog đến trước vị trí 1016648 của `binlog.000086` trên MySQL độc lập, xác minh rồi nhập lại: 22 BĐS, 15 tài khoản, 4 môi giới, 8 danh mục, 10 lịch hẹn, 15 hợp đồng. SQL phục hồi và bản sao binlog nằm trong `backend/storage/app/private/` (không đưa vào Git).
- Đã ép SQLite trước khi Laravel khởi động và thêm chốt từ chối mọi database kiểm thử khác SQLite `:memory:`. Kiểm thử lại trong Docker: 18 tests, 199 assertions đạt. Frontend: property regression, cú pháp toàn bộ source, auth-session và production build đạt.
- `frontend/tests/compare-browser.ps1` chạy Chrome ẩn: đạt bố cục 390/820/1365 px, bộ lọc khác biệt, thu gọn và không có runtime exception. Ảnh kiểm tra: `frontend/tests/compare-390.png`, `compare-820.png`, `compare-1365.png`.

## Database là nguồn dữ liệu chính

### Đăng tin và phân loại sau khi chuyển database

Đã bỏ đăng nhập Admin giả khi timeout/lỗi API, bỏ tự gửi mật khẩu admin từ dữ liệu localStorage. Chỉ coi đăng nhập thành công khi máy chủ xác nhận và lưu cookie phiên thật. Phiên hết hạn mở form đăng nhập ngay trong trang quản lý, giữ form đang nhập; không nới quyền ghi API để bỏ qua xác thực. Timeout đăng nhập tăng từ 4 lên 20 giây.

Phân loại tải trực tiếp từ SQL, không dùng danh mục mẫu/cache làm dữ liệu chính. Form thêm/sửa dùng các loại đang hoạt động từ API. Danh sách phân loại kiểm tra lại mỗi 5 giây và sau thao tác ghi. API tạo/sửa gán property_type_id đúng loại SQL, số lượng danh mục cập nhật từ quan hệ thật.

Đã chạy `php artisan properties:sync-types` trên baocaocdptw1_db: 8 loại, 22 tin được gán loại; không xóa danh mục cũ. Đã chạy `frontend/tests/live-property-create.mjs --create` với đăng nhập thật, thao tác form thật và đọc lại SQL bằng `backend/scripts/verify-created-property.php`: tạo thành công, có đúng bản ghi trong baocaocdptw1_db, đúng loại, bộ đếm loại tăng 1. Tin thử đã được xóa riêng sau kiểm tra; các tin hiện có giữ nguyên.

Kiểm tra bổ sung: PHPUnit 17 bài, 184 assertions đạt; `auth-session.test.mjs` kiểm tra timeout/401/403/500 không đăng nhập giả; `expired-session-browser.mjs` kiểm tra popup đăng nhập khi cookie hết hạn. Chạy test live cần tài khoản kiểm thử hợp lệ và biến môi trường MySQL, không dùng tài khoản giả trong localStorage để ghi dữ liệu.

Đính chính kết nối sau khi đối chiếu link phpMyAdmin của người dùng: database chuẩn là `baocaocdptw1_db`. Docker trước đây ghi đè .env để dùng `quanly_bds`, gây hai bên 21/22 tin. Đã sao lưu cả hai bảng properties vào `backend/storage/app/private/property-database-sync-20261018-195329.json`, xác nhận 21 mã chung không khác nội dung và chỉ bổ sung SAL-OPUZ-854 sang baocaocdptw1_db. Không ghi đè tin cũ hoặc xóa database nguồn.

Đã đổi DB_DATABASE và MYSQL_DATABASE trong docker-compose.yml sang baocaocdptw1_db, tạo lại riêng backend để áp dụng. API đang chạy xác nhận header X-Database-Name=baocaocdptw1_db, thống kê total=22, active=22; API quản lý trả 22 dòng và có SAL-OPUZ-854. PHPUnit sau đồng bộ đạt 16 bài, 177 assertions. Script đối chiếu/nhập thiếu: `backend/scripts/sync-property-databases.php`, chỉ ghi khi truyền --apply.

Các đoạn nhắc quanly_bds phía dưới mô tả lần kiểm tra trước; website hiện đã dùng baocaocdptw1_db.

Đối chiếu MySQL `quanly_bds`: database có 22 bản ghi (gồm thùng rác), file `backend/database/data/all_properties.json` có 21 mã; không thiếu mã nào từ file. Không xóa tin được thêm trong database để ép bằng số lượng file. Trang công khai chỉ tính tin đang hiện và còn hạn nên số hiển thị có thể nhỏ hơn tổng database.

`php artisan properties:sync --check` chỉ đối chiếu; `php artisan properties:sync` nhập các mã còn thiếu. Đã chạy đồng bộ trên database hiện tại, kết quả vẫn 22 bản ghi. Seeder dùng firstOrCreate gồm cả thùng rác, không ghi đè nội dung, giá, trạng thái hoặc tự phục hồi tin đã xóa. JSON chỉ dùng khởi tạo, không thay database khi API rỗng hoặc lỗi.

Trang khách và danh sách quản lý kiểm tra API mỗi 5 giây khi tab hiển thị, cập nhật ngầm không xóa lựa chọn hoặc hiện spinner liên tục. Khi quay lại tab hoặc có thao tác ghi thì kiểm tra ngay. Chi tiết đang xem cũng nhận dữ liệu mới. Cột `price` là giá chính; API tính lại giá bán/thuê dạng số/chữ từ cột này để sửa giá trực tiếp không còn bị chuỗi giá cũ che mất.

Kiểm tra: PHPUnit toàn bộ đạt 16 bài, 177 assertions, gồm nhập file không trùng/không ghi đè và sửa trực tiếp bằng DB::table rồi đọc API. `frontend/tests/database-refresh-browser.mjs` xác nhận trang khách và quản lý tự đổi tên/giá khi API thay đổi, không tải lại trang; API trong bài Chrome được mô phỏng để không sửa tin thật.

## Bổ sung: nhập giá, diện tích và địa chỉ quá dài

Sửa bổ sung d/e: ô số chuyển sang tel với inputMode decimal; chỉ cho phép sự kiện xóa khi đã có thao tác Backspace/Delete hoặc Cut. Chặn beforeinput delete không có thao tác tương ứng và khôi phục giá trị đã chấp nhận nếu bộ gõ gửi input xóa không thể hủy. Chrome đã kiểm tra d/e khi chọn toàn bộ số, xóa do IME trước keydown, input xóa không hủy được và Backspace thật. Bộ mã form có URL phiên bản mới v=10 để tránh tải lại module cũ từ cache. Kiểm tra này mô phỏng IME, không xác nhận trực tiếp mọi bộ gõ Windows.

Cập nhật giới hạn nhập: tối đa 20 chữ số ở cả giá và diện tích (không tính dấu chấm). Nhập/dán vượt giới hạn hoặc gửi trực tiếp API hơn 20 chữ số hiện “Mức giá bạn muốn bán đã nhiều hơn tài sản của tỉ phú Elon Musk”. Các giới hạn giá trị lưu trong database vẫn được kiểm tra riêng. Bổ sung chặn beforeinput dạng deleteContentBackward phát sinh sau phím chữ d và bảo vệ giá trị khi kết thúc composition; Backspace thật vẫn dùng được. Kiểm tra trình duyệt mô phỏng sự kiện bộ gõ, chưa tương đương kiểm tra trực tiếp mọi bộ gõ Windows.

Bổ sung xử lý phím d/D và các chữ khác: chặn trước khi thay thế vùng chọn, giữ số cũ khi dán dữ liệu sai hoặc kết thúc nhập bằng bộ gõ. Chrome đã kiểm tra bấm d khi chọn toàn bộ giá trị và dán chữ, không làm mất số đang nhập. Phím điều hướng, xóa và tổ hợp sao chép/dán vẫn được phép.

Form tạo/sửa dùng ô văn bản với bàn phím số thập phân, chặn e/E, dấu cộng/trừ và dữ liệu dán sai định dạng. Chấp nhận tối đa 2 chữ số thập phân. Giá tối đa 9.999.999.999.999 VNĐ; diện tích lớn hơn 0 và tối đa 100.000.000 m²; địa chỉ tối đa 255 ký tự. Kiểm tra cả trình duyệt và API, thông báo bằng tiếng Việt.

Bỏ gửi lại yêu cầu sang localhost:8080 khi API cùng nguồn trả lỗi: lỗi dữ liệu 422 trước đây bị thay bằng lỗi phiên đăng nhập của cổng khác. Dữ liệu không hợp lệ được kiểm tra trước xác thực để không báo nhầm lỗi đăng nhập khi nhập quá dài.

Kiểm chứng: `frontend/tests/property-form-browser.mjs` chạy form chỉnh sửa thật trong Chrome, mô phỏng phản hồi API để không thay đổi tin thật. Đạt các ca gõ/dán e, số vượt giới hạn, địa chỉ dài và giữ nguyên lỗi 422. Backend: 11 bài kiểm tra, 129 assertions đạt.

Đối chiếu phần phân công trang 4–5 của PDF và bản chạy tại `http://localhost:3000`.

## Cập nhật tạm ẩn và rà soát theo phân công

Theo lựa chọn của người dùng, tin tạm ẩn cũng bị loại khỏi mục Đã xem: bộ đếm, danh sách modal và phần xem gần đây. Frontend đối chiếu với danh sách công khai mới nhất; API lịch sử chỉ trả tin đang hiện, còn hạn và chưa xóa. Không xóa nhật ký gốc; nếu bật hiện lại, tin có thể xuất hiện lại trong lịch sử. Chrome kiểm tra bằng `frontend/tests/history-browser.mjs` đạt; bộ PropertyLifecycleTest đạt 9 bài, 148 assertions, bao gồm ghi xem → tạm ẩn → lịch sử rỗng → bật lại.

Nút tạm ẩn đơn lẻ, ẩn hàng loạt và đổi trạng thái sang ẩn không bắt buộc nhập lý do. API tự ghi lý do mặc định trong lịch sử. Chrome đã kiểm tra các nút trên component quản lý của bundle thật, dùng API mô phỏng để không thay đổi tin của người dùng. Backend SQLite xác nhận ẩn/bật lại làm thay đổi đúng danh sách công khai, thống kê và lịch sử.

Các lỗi bổ sung đã sửa: trạng thái chọn trong form chỉnh sửa trước đây bị API bỏ qua; lưu nháp của admin bị đổi thành đang hiện; ảnh để trống khi chỉnh sửa bị mất thay vì giữ ảnh cũ. Trạng thái và số phòng được chuẩn hóa kiểu dữ liệu để các nút kiểm tra trạng thái hoạt động nhất quán. Danh sách quản lý, bộ lọc hết hạn và thống kê dùng cùng trạng thái hiệu lực theo ngày hết hạn.

Kết quả cuối lượt này: toàn bộ PHPUnit đạt 14 bài, 163 assertions; kiểm tra catalog, cú pháp nguồn frontend, form nhập và nút ẩn/bật/ẩn hàng loạt trên Chrome đạt. Lệnh cho luồng ẩn: `node frontend/tests/property-hide-browser.mjs` (cần Playwright và Chrome).

| Chức năng trong phân công | Phạm vi đã kiểm tra |
| --- | --- |
| 1, 4, 6: Quản lý BĐS, thông tin, tin đăng | API danh sách, phân trang, tìm kiếm, sửa giá/ảnh/trạng thái; giao diện thao tác nhanh |
| 2: Xóa/khôi phục | API xóa mềm, thùng rác, khôi phục, xóa vĩnh viễn và kiểm tra quyền |
| 3: Phân loại | API lưu, đổi tên, slug trùng, vòng lặp cha/con, danh mục đang được dùng |
| 5: Tạo tin | API tạo, nháp, dữ liệu sai, giá/diện tích/địa chỉ; bộ nhập dùng chung cho form tạo/sửa |
| 7, 14: Kiểm duyệt, trạng thái | API duyệt, ẩn, hiện, lịch sử; Chrome nút ẩn và ẩn hàng loạt; sửa trạng thái qua form |
| 8: Gia hạn | API số ngày, mốc hết hạn, không tự bỏ ẩn hoặc duyệt tin chờ duyệt |
| 9–13: Tìm kiếm, giá, diện tích, loại, sắp xếp | Hồi quy bộ lọc dùng chung, biên khoảng, dữ liệu thiếu, số dạng chuỗi, tiếng Việt không dấu |
| 15: Chi tiết | Chrome mở tin từ liên kết chia sẻ; dữ liệu công khai và trạng thái hiển thị |
| 16: Bản đồ | Kiểm tra tọa độ, loại vị trí thiếu/sai, căn theo kết quả trong mã nguồn và bundle; chưa kiểm tra toàn bộ thao tác bản đồ bằng tay |
| 17–19: Yêu thích, so sánh, chia sẻ | Chrome lưu sau tải lại, 4 tin so sánh trên điện thoại, mở liên kết, clipboard bị chặn |
| 20: Lịch sử xem | API ghi không trùng, xóa chính xác từng tin/toàn bộ, dữ liệu lưu hỏng |

Đây là phạm vi kiểm tra thực tế, không phải cam kết đã thử mọi tổ hợp đầu vào hoặc không còn lỗi. Các bài Chrome quản lý dùng API mô phỏng; các thao tác ghi thật được kiểm tra riêng trong SQLite. Source quản trị đầy đủ vẫn chưa có trong src.

## Lỗi tin biệt thự không tìm thấy

Tin “Test BĐS Biệt Thự Thảo Điền Quận 2”, mã `SAL-OPUZ-854`, id 22, đang hiện trong MySQL và API công khai. Giao diện chỉ nhận 21 tin do cơ chế chờ API 3 giây rồi dùng dữ liệu mẫu. Thay bằng truy vấn cùng máy chủ, chờ 20 giây, thử lại một lần và báo lỗi khi mất kết nối. Không dùng dữ liệu mẫu thay cho dữ liệu thật hoặc danh sách rỗng.

Tìm kiếm dùng chung bộ xử lý `frontend/src/utils/propertyCatalog.js`: bỏ khoảng trắng, hỗ trợ tiếng Việt không dấu, tìm cả tiêu đề, mã tin, dự án, địa chỉ, đường, quận và thành phố. Đồng bộ lại khi trở về tab, có mạng, sau thao tác ghi thành công và mỗi phút khi trang đang hiển thị.

## Các sửa chữa khác

- API quản lý trả đúng data/meta, hỗ trợ lọc, tìm kiếm, sắp xếp, phân trang và thống kê.
- Giá đúng mục đích bán/thuê; khoảng giá/diện tích không trùng mốc; loại dữ liệu thiếu khỏi khoảng thấp nhất; nhận 4+ phòng ngủ và số dạng chuỗi; lọc biệt thự đơn lập bằng nhóm biệt thự.
- Trang khách chỉ nhận tin đang hiện, chưa xóa và chưa hết hạn. Tin của tôi lấy theo phiên đăng nhập, không tin user_id do trình duyệt gửi.
- Bổ sung API tạo/sửa, xóa mềm, thùng rác, khôi phục, xóa vĩnh viễn, duyệt/ẩn, gia hạn, lịch sử thay đổi và thao tác hàng loạt. Kiểm tra đăng nhập, quyền sở hữu/quản trị và dữ liệu đầu vào. Giao dịch dữ liệu ngăn cập nhật hàng loạt dở dang.
- Gia hạn tính từ hạn còn hiệu lực hoặc hiện tại; không tự duyệt tin chờ duyệt hoặc bỏ ẩn tin bị từ chối.
- Phân loại lưu thật qua API; không báo thành công khi API lỗi. Kiểm tra slug trùng, vòng lặp danh mục cha và danh mục đang sử dụng. Đổi tên loại cập nhật BĐS tham chiếu.
- Lịch sử xem cập nhật cùng tin thay vì chèn trùng; xóa theo mã chính xác thay vì LIKE.
- Dữ liệu yêu thích/lịch sử sai định dạng không làm hỏng trang.
- Chia sẻ có mã tin và tự mở chi tiết. Clipboard bị chặn thì hiển thị liên kết để sao chép thủ công.
- Bản đồ không bịa vị trí khi thiếu tọa độ; kiểm tra giới hạn và căn theo kết quả.
- Bảng so sánh nhận focus từ menu và cuộn trên điện thoại.
- Nút cập nhật database chỉ migrate giữ dữ liệu, không migrate:fresh hoặc seed ghi đè. Chỉ quản trị viên đã đăng nhập được gọi.

## Nguồn và bản chạy

`frontend/dist` chứa màn hình quản trị không có trong `frontend/src`. Script `frontend/scripts/repair-deployed-catalog.mjs` đưa bộ xử lý có nguồn và kiểm tra vào bundle hiện tại, giữ nguyên giao diện quản trị; kiểm tra cấu trúc và cú pháp trước khi ghi, có thể chạy lại.

Không build đè dist từ src hiện tại: source thiếu màn hình quản trị. Cần khôi phục source đầy đủ trước khi build lại toàn bộ. Nhận định ban đầu rằng không có giao diện quản trị là thiếu kiểm tra bản chạy và đã được đính chính.

Migration `2026_10_19_000001_extend_property_types_table.php` đã chạy trên MySQL hiện tại: chỉ thêm cột danh mục cha, mô tả và trạng thái. Không xóa hoặc seed dữ liệu thật.

## Kiểm tra tái lập

- Trong backend: `php vendor/phpunit/phpunit/phpunit tests/Feature` dùng SQLite trong bộ nhớ để kiểm tra vòng đời tin, phân quyền, danh sách công khai, danh mục, lịch sử và ngăn reset database.
- `node frontend/tests/catalog.test.mjs --live`: kiểm tra tìm kiếm/lọc, lỗi API, danh sách rỗng, bundle và tin SAL-OPUZ-854 qua HTTP thật.
- `node frontend/tests/property.test.mjs`: hồi quy tọa độ, dữ liệu lưu và cú pháp toàn bộ nguồn frontend.
- `node frontend/tests/catalog-browser.mjs`: Chrome headless tại localhost:3000; tìm theo test/thao dien/địa chỉ, API chậm hơn 3 giây, chia sẻ, clipboard bị chặn, localStorage hỏng, yêu thích và so sánh trên điện thoại. Cần Playwright và Chrome; có thể đặt PLAYWRIGHT_MODULE và CHROME_PATH.

Ảnh kết quả: `frontend/tests/catalog-search.png`.

Thao tác ghi được kiểm tra bằng API trên dữ liệu thử nghiệm. Chưa khẳng định mọi tổ hợp thao tác trên giao diện quản trị đều đã được kiểm tra; source quản trị đầy đủ vẫn chưa có trong workspace.
