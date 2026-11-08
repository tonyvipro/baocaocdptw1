import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/qa-live-2026-11-08');
const r = JSON.parse(fs.readFileSync(path.join(dir, 'live-results.json'), 'utf8'));
const search = JSON.parse(fs.readFileSync(path.join(dir, 'search-live-results.json'), 'utf8'));
const byId = new Map(r.checks.map(c => [c.id, c]));
const cell = value => String(typeof value === 'object' ? JSON.stringify(value) : value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const status = ids => ids.some(id => byId.get(id)?.status === 'FAIL') ? 'FAIL' : ids.some(id => !byId.has(id) || byId.get(id).status === 'BLOCKED') ? 'BLOCKED/CHƯA ĐỦ' : 'PASS';
const features = [
  ['Quản lý BĐS', ['CREATE-01', 'UPDATE-01', 'SEC-01', 'SEC-02'], 'CRUD cơ bản chạy; nhánh dữ liệu quản trị bị truy cập khi chưa đăng nhập.'],
  ['Xóa / Khôi phục', ['DELETE-01', 'DELETE-02', 'RESTORE-01', 'DELETE-03', 'BULK-01'], 'Đã xóa mềm, kiểm tra trash, khôi phục, chặn hard delete sai điều kiện và rollback bulk. Hard delete dọn fixture được ghi riêng.'],
  ['Phân loại', ['TYPE-01', 'TYPE-02', 'TYPE-03', 'TYPE-04', 'TYPE-05', 'VAL-11'], 'Danh mục CRUD/ràng buộc chạy; tạo tin với loại không tồn tại vẫn được chấp nhận.'],
  ['Quản lý thông tin BĐS', ['UPDATE-01', 'AREA-01', 'VAL-01', 'VAL-02', 'VAL-05', 'VAL-10'], 'Giá tiền tỷ, số sai và round-trip diện tích đã chạy; thiếu giá bị biến thành 0.'],
  ['Tạo tin đăng', ['CREATE-01', 'CREATE-02', 'VAL-03', 'VAL-04', 'VAL-09', 'VAL-10'], 'Poster tạo status=0 đúng; thiếu giá vẫn 201.'],
  ['Quản lý tin', ['OWN-01', 'SEC-01', 'AUTH-03'], 'Chặn sửa/xóa khác chủ; guest đọc được admin list; token-only không được nhận diện ở trash.'],
  ['Kiểm duyệt tin', ['STATUS-01', 'MOD-01', 'MOD-02', 'MOD-03', 'SEC-05'], 'Không tự duyệt được; reject mất lý do và không bắt buộc lý do ở bulk.'],
  ['Gia hạn tin', ['EXT-01', 'EXT-02', 'EXT-03', 'EXT-04'], 'Còn hạn/hết hạn, thời lượng sai và tin ẩn. Chưa kiểm thử thu phí vì endpoint này không triển khai thu phí.'],
  ['Quản lý trạng thái', ['STATUS-01', 'SEC-04', 'SEC-06', 'EXPIRY-01', 'UI-22'], 'Luồng chính/expiry chạy; guest bypass qua admin=1 vẫn lấy tin ẩn.'],
  ['Tìm kiếm', [], '15 HTTP GET độc lập: smart search đang hoạt động; từ khóa, không kết quả, tiếng Việt và validation đã chạy.'],
  ['Lọc giá', ['UI-02', 'UI-05', 'UI-06', 'UI-08'], 'Đủ hai đầu và min>max được kiểm tra; chỉ nhập min bị trả rỗng.'],
  ['Lọc diện tích', ['UI-02', 'UI-07'], 'Lọc kết hợp và khoảng chỉ có min.'],
  ['Lọc loại BĐS', ['UI-02'], 'Kiểm tra căn hộ giao với điều kiện giá và diện tích.'],
  ['Sắp xếp kết quả', ['UI-03', 'UI-04'], 'Giá tăng/giảm, diện tích giảm và mới nhất trên các fixture biết trước.'],
  ['Xem chi tiết', ['UI-09', 'UI-16', 'UI-22'], 'Đúng deep link; đối chiếu description thực tế với nội dung hiển thị.'],
  ['Xem bản đồ', ['VAL-12', 'VAL-13', 'UI-10', 'UI-21'], 'Tọa độ Tokyo/cặp thiếu, iframe theo ghim, lỗi tile được mô phỏng bằng abort request nhà cung cấp.'],
  ['Yêu thích', ['UI-11', 'UI-19'], 'Lưu/reload và mở lại tin đã bị ẩn.'],
  ['So sánh', ['UI-12', 'UI-13', 'UI-14', 'UI-20'], 'Hai tin, khác phân loại, giới hạn 4 và tin bị xóa giữa phiên.'],
  ['Chia sẻ', ['UI-23', 'UI-15', 'UI-16', 'UI-17'], 'Clipboard thật, clipboard bị từ chối, deep link và đóng modal qua refresh.'],
  ['Lịch sử xem', ['HISTORY-01', 'HISTORY-02', 'UI-18'], 'DB chống trùng/không tin snapshot client/cách ly tài khoản, local thứ tự xem; endpoint ghi còn nhận tin đã hết hạn.'],
];
const issues = [
  ['SEC-01', 'P1', 'Khách lấy được danh sách quản trị và tin chờ duyệt/ẩn', 'backend/routes/web.php:194; backend/app/Http/Controllers/PropertyReadController.php:50', 'Bảo vệ index bằng actor/policy Admin trước khi query; admin=1 chỉ chọn view, không cấp quyền.', 'backend-fix-proposals.md'],
  ['SEC-02', 'P2', 'Thống kê quản trị và tên DB bị trả công khai', 'backend/app/Http/Controllers/PropertyReadController.php:98,117', 'Xác thực/phân quyền stats, bỏ X-Database-Name.', 'backend-fix-proposals.md'],
  ['AUTH-03', 'P2', 'Token đăng nhập hợp lệ bị từ chối tại property management', 'backend/app/Http/Controllers/PropertyManagementController.php:16', 'Thống nhất actor session/Sanctum cho authorize, owner và audit.', 'backend-fix-proposals.md'],
  ['MOD-01', 'P2', 'Lý do từ chối không tồn tại khi đọc lại tin', 'backend/app/Http/Controllers/PropertyManagementController.php:174', 'Persist rejection_reason; xác minh schema thực trước khi chọn migration.', 'backend-fix-proposals.md'],
  ['MOD-02', 'P2', 'Bulk reject thiếu lý do vẫn thành công', 'backend/app/Http/Controllers/PropertyManagementController.php:208', 'Giữ ý nghĩa reject/hide và yêu cầu reason cho reject trước khi chuẩn hóa action.', 'backend-fix-proposals.md'],
  ['VAL-10', 'P2', 'Thiếu giá được lưu thành 0', 'backend/app/Http/Controllers/PropertyManagementController.php:29,80', 'Loại giá explicit: fixed cần amount, negotiable cho null; không mặc định missing thành 0.', 'search-fix-proposals.md'],
  ['VAL-11', 'P2', 'Chấp nhận loại không tồn tại', 'backend/app/Http/Controllers/PropertyManagementController.php:27,98', 'Yêu cầu danh mục active tồn tại; derive tên loại từ ID.', 'search-fix-proposals.md'],
  ['VAL-12', 'P2', 'Chấp nhận tọa độ ngoài vùng Việt Nam theo phạm vi yêu cầu', 'backend/app/Http/Controllers/PropertyManagementController.php:37', 'Validate cặp lat/lng và polygon vùng phục vụ được phê duyệt; đây là gap theo phạm vi yêu cầu.', 'search-fix-proposals.md'],
  ['VAL-13', 'P2', 'Chấp nhận một thành phần tọa độ bị thiếu', 'backend/app/Http/Controllers/PropertyManagementController.php:37', 'Hai thành phần cùng có hoặc cùng thiếu; xác thực cặp sau numeric validation.', 'search-fix-proposals.md'],
  ['UI-06', 'P1', 'Lọc giá chỉ có min trả rỗng', 'frontend/src/components/PropertyFilter.jsx:133; frontend/src/utils/propertyCatalog.js:19', 'Cho phép upper bound Infinity trong inRange, giữ kiểm tra số hữu hạn cho min/value.', 'search-fix-proposals.md'],
  ['UI-07', 'P1', 'Lọc diện tích chỉ có min trả rỗng', 'frontend/src/components/PropertyFilter.jsx:148; frontend/src/utils/propertyCatalog.js:19', 'Dùng chung hàm khoảng có đầu mở và thêm test min-only.', 'search-fix-proposals.md'],
  ['UI-09', 'P2', 'Mô tả chi tiết dùng nội dung cố định thay dữ liệu tin', 'frontend/src/components/PropertyModal.jsx:389', 'Render description thực; tiện ích lấy từ tin và chỉ dùng fallback có nhãn rõ ràng.', 'search-fix-proposals.md'],
  ['UI-10', 'P2', 'Iframe bản đồ bỏ qua tọa độ lưu', 'frontend/src/components/PropertyModal.jsx:430', 'Ưu tiên cặp tọa độ; fallback địa chỉ đầy đủ.', 'search-fix-proposals.md'],
  ['UI-13', 'P2', 'So sánh đất với căn hộ không chặn/cảnh báo khác loại', 'frontend/src/App.jsx:316; frontend/src/components/CompareDrawer.jsx:39', 'Kiểm tra loại và mục đích trước khi thêm; quyết định rule chặn hay nhóm rõ.', 'interaction-fix-proposals.md'],
  ['UI-15', 'P2', 'Clipboard thất bại vẫn báo đã chép', 'frontend/src/components/PropertyCard.jsx:18', 'Await clipboard, catch lỗi và fallback; chỉ báo thành công sau khi writeText resolve.', 'interaction-fix-proposals.md'],
  ['UI-17', 'P2', 'Modal chia sẻ tự mở lại sau refresh catalog', 'frontend/src/App.jsx:437', 'Consume deep-link intent một lần; đóng modal phải xóa/đánh dấu intent.', 'interaction-fix-proposals.md'],
  ['UI-19', 'P1', 'Yêu thích mở lại snapshot của tin đã ẩn', 'frontend/src/App.jsx:150,305,903', 'Lưu mã tham chiếu; resolve dữ liệu từ catalog hiện hành và kiểm tra quyền khi mở.', 'interaction-fix-proposals.md'],
  ['UI-20', 'P1', 'So sánh mở lại snapshot của tin đã xóa', 'frontend/src/App.jsx:316; frontend/src/components/CompareDrawer.jsx:46', 'Reconcile selected IDs với catalog; chặn onSelectProperty đối tượng stale.', 'interaction-fix-proposals.md'],
  ['UI-21', 'P2', 'Tile lỗi không có trạng thái lỗi/thử lại', 'frontend/src/components/MapView.jsx:44', 'Theo dõi loading/tileerror, hiển thị fallback và nút retry.', 'search-fix-proposals.md'],
  ['HISTORY-02', 'P2', 'Ghi lịch sử vẫn chấp nhận tin hết hạn', 'backend/routes/web.php:125', 'Dùng cùng scope publiclyVisible như public catalog khi ghi lịch sử.', 'interaction-fix-proposals.md'],
];
const times = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' });
const count = s => r.checks.filter(c => c.status === s).length;
let md = `# Báo cáo live QA Bất động sản — 08/11/2026\n\n`;
md += `**Kết luận: ${count('FAIL') ? 'FAIL — có lỗi cần sửa' : 'xem chi tiết kết quả'}.** Chạy thật tại ${r.base}, backend localhost:8080. Bắt đầu ${times.format(new Date(r.startedAt))}; kết thúc ${r.finishedAt ? times.format(new Date(r.finishedAt)) : 'đang chạy'} theo giờ Việt Nam.\n\n`;
md += `Bộ chính: **${r.checks.length} check, ${count('PASS')} PASS, ${count('FAIL')} FAIL, ${count('BLOCKED')} BLOCKED**, ${r.requests.length} request HTTP được ghi. Bổ sung **15 GET chỉ đọc** kiểm thử search (đếm riêng, không cộng thành số test case). Mỗi check có thể có nhiều request.\n\n`;
md += `## Môi trường và giới hạn bằng chứng\n\n- User đăng nhập thực tế: ID17, role_id=5; Admin ID1, role_id=1. Chưa chạy tài khoản Broker role_id=2 riêng. Không lưu mật khẩu, cookie hay token vào artifact.\n- HTTP chính qua frontend cổng3000; search đọc trực tiếp cổng8080. Browser dùng Chrome headless và Playwright có sẵn trong project. Không mock response API ứng dụng. Tile map bị abort chủ động là fault injection, không phải kết luận nhà cung cấp đang lỗi.\n- Bundle thực tế: ${cell(r.browserEnvironment?.scripts || 'chưa ghi nhận')}. Bundle frontend/dist trong workspace có tên khác; không build/deploy trong phiên này. Vị trí sửa tham chiếu source workspace, kết quả UI dựa trên bundle đang được phục vụ.\n- Các FAIL về giá thiếu, vùng Việt Nam và tương thích so sánh đối chiếu yêu cầu người dùng; sản phẩm cần ghi rõ chính sách fixed/negotiable, vùng phục vụ và chặn hay cảnh báo.\n- Không kiểm thử thanh toán thật cho gia hạn: endpoint hiện chỉ tăng ngày, chưa có luồng thu phí tương ứng. Chưa thực thi concurrent payment/moderation, hard delete hồ sơ tài chính, upload tệp thực thi hoặc POI radius. Không coi các phần này là PASS.\n- Biên thời gian đã kiểm tra trước/sau hạn thực; không khẳng định độ chính xác đúng giây hết hạn qua HTTP. Diện tích 99999999.99 round-trip live PASS; rủi ro FLOAT từ source chưa tái hiện.\n\n`;
md += `## Ma trận 20 chức năng\n\nPASS chỉ áp dụng cho những biến thể đã thực thi; FAIL không phủ nhận happy path khác đã pass.\n\n| # | Chức năng | Kết quả | Bằng chứng / phạm vi |\n|---|---|---|---|\n`;
features.forEach(([name, ids, note], i) => {
  const s = ids.length ? status(ids) : search.summary.providerAvailable && search.summary.additional?.functionalAccentComparisonPassed ? 'PASS' : 'BLOCKED/CHƯA ĐỦ';
  md += `| ${i + 1} | ${name} | **${s}** | ${cell(note)} ${ids.join(', ')} |\n`;
});
md += `\n## Lỗi đã tái hiện\n\n| Check | Ưu tiên | Lỗi | File và dòng | Đề xuất code |\n|---|---|---|---|---|\n`;
for (const [id, priority, title, source, fix, proposal] of issues) if (byId.get(id)?.status === 'FAIL') md += `| ${id} | ${priority} | ${title} | ${cell(source)} | ${fix} [Snippet](${proposal}) |\n`;
md += `\n## Rủi ro chỉ phát hiện từ source\n\n- Hard delete có thể cascade property → contracts → invoices → transactions: PropertyManagementController.php:169; migrations contracts:39, invoices:22, transactions:20. Không xóa thử hồ sơ kinh doanh hiện có. Kiểm tra FK/schema live trước khi quyết định restrict/archive. [Đề xuất](backend-fix-proposals.md).\n- Duyệt chưa gắn expected revision/version; chưa chạy race với hai moderator trên live. [Đề xuất](backend-fix-proposals.md).\n- Không thấy hook notification duyệt/từ chối trong luồng hiện tại; chưa kết luận kết quả gửi thực tế.\n- Local storage theo thiết bị, account switch/history merge và retry xóa có rủi ro từ source; chưa thực thi đủ các biến thể live này. [Đề xuất](interaction-fix-proposals.md).\n\n`;
md += `## Kiểm tra hồi quy tách biệt\n\n- Backend: **41 tests, 352 assertions PASS**, SQLite :memory:, không phải DB live. Search-provider test ở suite này dùng mock. [Log](backend-regression.txt).\n- Frontend: **5/8 script PASS**. catalog assertion chuỗi bundle minify thất bại; search-suggestions và property-media không chạy assertion vì thiếu @rollup/rollup-win32-x64-msvc. Đây là vấn đề bộ test/dependency, không tự chuyển thành lỗi sản phẩm. [Log](frontend-regression.txt).\n- Search HTTP: provider live trả200; Vinhomes normal/catalog cùng3 kết quả; Căn hộ/Can ho cùng tập22 ID tại thời điểm đo. Snapshot ban đầu thay đổi do fixture39/40 được tạo đồng thời; điều đó không phải bằng chứng lộ trạng thái. [Evidence](search-live-results.json).\n\n`;
md += `## Chi tiết từng check live\n\n| ID | Chức năng | Loại | Kỳ vọng | Thực tế | Kết quả |\n|---|---|---|---|---|---|\n`;
for (const c of r.checks) md += `| ${c.id} | ${cell(c.feature)} | ${c.kind} | ${cell(c.expected)} | ${cell(c.actual)}${c.screenshot ? ` [Ảnh](${c.screenshot})` : ''} | **${c.status}** |\n`;
md += `\n## Dữ liệu QA và dọn dẹp\n\nRun: ${r.run}. Tin tạo bởi runner: ${r.fixtures.map(f => f.id).join(', ')}; danh mục: ${r.categories.join(', ')}. Chỉ các ID do run này tạo được đưa vào cleanup. Nhật ký/audit thao tác được giữ theo hành vi hệ thống.\n\n| Loại | ID/actor | Kết quả cleanup |\n|---|---|---|\n`;
for (const c of r.cleanup) md += `| ${c.kind} | ${c.id ?? c.actor} | ${cell(c)} |\n`;
md += `\n## Chạy lại\n\nScript chính: scripts/qa/live-real-estate.mjs, browser module: scripts/qa/live-real-estate-browser.mjs. Cần Node, Chrome, Playwright đã có tại frontend/node_modules/.audit-browser/node_modules/playwright, hai tài khoản được cung cấp qua biến QA_USER_EMAIL, QA_USER_PASSWORD, QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD. QA_BASE_URL mặc định http://127.0.0.1:3000. Không ghi credential vào source.\n\nChạy từ root: node scripts/qa/live-real-estate.mjs. Script sẽ ghi bằng chứng và dọn fixture trong finally. Nếu tiến trình bị cưỡng bức dừng, dùng danh sách fixture trong live-results.json để dọn đúng ID sau khi xác minh chúng thuộc run.\n\nRaw evidence: [live-results.json](live-results.json), [console](live-console.txt), [search-live-results.json](search-live-results.json). Các file fix-proposals là đề xuất review, chưa áp dụng vào mã ứng dụng.\n`;
fs.writeFileSync(path.join(dir, 'REPORT.md'), md);
console.log(JSON.stringify({ report: path.join(dir, 'REPORT.md'), checks: r.checks.length, pass: count('PASS'), fail: count('FAIL'), blocked: count('BLOCKED'), finished: Boolean(r.finishedAt) }));
