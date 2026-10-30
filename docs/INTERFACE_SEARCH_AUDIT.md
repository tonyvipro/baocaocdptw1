# Gợi ý tìm kiếm, biểu mẫu và nhật ký chi tiết

## Tìm kiếm dự án / BĐS

- Ô tìm kiếm thông minh hiển thị gợi ý dự án và BĐS sau debounce 350 ms. Dữ liệu BĐS lấy từ danh sách ID công khai do Meilisearch trả về, không dùng dữ liệu giả khi API lỗi.
- Thứ tự ưu tiên BĐS: tên bắt đầu bằng từ khóa, một từ trong tên bắt đầu bằng từ khóa, tên chứa từ khóa, mã tin khớp đầu, rồi các kết quả liên quan do Meilisearch tìm được. Hỗ trợ chữ có/không dấu, kể cả `d` / `đ`.
- Ô **Dự án trọng điểm** có thể gõ để lọc và chọn dự án thay cho select cố định. Không hiển thị dự án trùng tên.
- Dùng ↑ / ↓ và Enter hoặc chuột để chọn, Escape/click ra ngoài để đóng. Có trạng thái đang tải, lỗi, không có gợi ý và nút xóa.
- Chọn dự án trong gợi ý chính sẽ lọc danh sách theo dự án đó. Chọn BĐS sẽ mở thông tin chi tiết. Giới hạn nhập vẫn là 250 ký tự.

Mã chính: `frontend/src/components/properties/SearchCombobox.jsx`, `ProjectSearchSelect.jsx`, `PropertySearchBar.jsx`, `frontend/src/utils/searchSuggestions.js`.

## Biểu mẫu và bố cục

- Dùng chung nền trắng, chữ slate, viền xám và màu xanh cho thao tác lưu/focus; thao tác nguy hiểm vẫn dùng màu đỏ.
- Các ô nhập, hộp biểu mẫu và thành phần quản trị dùng góc vuông qua `frontend/src/styles/form-theme.css`.
- Menu môi giới căn trái, biểu tượng không bị co, nhãn nhiều dòng vẫn căn trái.
- Mã yêu cầu và tiêu đề cột không xuống dòng. Bảng môi giới/phân công cuộn ngang khi thiếu chỗ.
- Dialog giới hạn theo chiều rộng/chiều cao viewport, có vùng cuộn; grid biểu mẫu chuyển theo breakpoint và các trường được phép co chiều ngang.

## Xác nhận sửa / xóa

`ConfirmProvider` dùng cho xác nhận lưu ở tài khoản, hồ sơ, mật khẩu, phân quyền, danh mục, môi giới, phân công, khách hàng và nhu cầu.

Khi xác nhận mở, các form/dialog và vùng nội dung quản trị phía sau được ẩn, đặt `inert` và `aria-hidden`; chỉ còn cửa sổ xác nhận nhận thao tác. Chọn **Quay lại** khôi phục form và bản nháp. Chọn xác nhận mới gửi yêu cầu lưu. Có giới hạn focus trong cửa sổ và hỗ trợ Escape.

Các luồng xóa/hủy có cửa sổ riêng đóng form sửa/xem trước khi mở xác nhận, để không chồng hai cửa sổ.

## Chi tiết nhật ký

- Observer ghi thay đổi thực ở người dùng, danh mục, môi giới/phân công, khách hàng, nhu cầu, loại BĐS, tương tác và lịch chăm sóc. Hợp đồng và các bản ghi snapshot BĐS được trình bày chi tiết theo dữ liệu trước/sau có sẵn.
- Chi tiết có tên trường, giá trị cũ và mới; bỏ thay đổi kỹ thuật của `version`, `updated_at`, token và các trường ngoài danh sách cho phép.
- Email/SĐT được che trong chi tiết. Mật khẩu chỉ ghi “Đã thay đổi”, không ghi mật khẩu hay hash.
- Một lần lưu không đổi dữ liệu được ghi rõ không có trường thay đổi; yêu cầu bị từ chối do validation/xung đột không tạo nhật ký thành công.
- Nhật ký có dữ liệu trước/sau từ các snapshot cũ cũng được chuyển thành chi tiết an toàn. Lịch sử cũ chỉ lưu một mô tả chung không thể khôi phục giá trị trước/sau đã thiếu.

Mã chính: `backend/app/Services/AuditChanges.php`, `backend/app/Observers/ManagementAuditObserver.php`, `frontend/src/components/ActivityLogDetails.jsx`.

## Kiểm tra

- Bộ hồi quy backend: 124 test đạt; sau điều chỉnh so sánh giá trị số, suite nhật ký chi tiết đạt 5 test / 31 assertion.
- Frontend: suggestions, input-policy, customers, demands, notifications, meilisearch và property-media đạt; build Vite thành công.
- Kiểm tra trực tiếp Meilisearch: `d`, `đ` và `tha` đều trả kết quả công khai.
- Kiểm tra trực tiếp MySQL: `docker compose exec backend php scripts/check-management-audit.php --verify-audit` đạt. Chế độ này chỉ dùng ở development, tạo một danh mục tạm và tự dọn bản ghi, nhật ký cùng token trong finally. Chạy không có cờ vẫn chỉ kiểm tra đọc các API.
- Không cần migration hay import lại index cho thay đổi giao diện này.
- Chưa kiểm tra trực quan tại 375/768/1280 px hoặc zoom bằng trình duyệt vì công cụ điều khiển hiện không có trình duyệt kết nối; kiểm tra SSR/build không thay thế bước đó.

Triển khai frontend mới:

```powershell
docker compose build frontend
docker compose up -d --no-deps frontend
```

Sau khi cập nhật, dùng Ctrl + F5 trên localhost:3000 hoặc localhost:3001.
