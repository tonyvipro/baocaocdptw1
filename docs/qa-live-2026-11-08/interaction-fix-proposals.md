# Đề xuất sửa tương tác người dùng — 2026-11-08

Đây là đề xuất từ audit mã nguồn hiện tại, chưa phải bản vá ứng dụng và chưa phải kết quả chạy test thực tế. Không có lệnh DB hoặc thay đổi dữ liệu thật trong công việc lập tài liệu này. Các số dòng bên dưới là số dòng đã đọc tại thời điểm lập tài liệu; cần đối chiếu lại nếu source có thay đổi đồng thời.

## 1. Yêu thích, so sánh và mở chi tiết dùng dữ liệu catalog hiện hành

**Điểm sửa hiện tại:**

- `frontend/src/App.jsx:150–152`: tải lại catalog chỉ cập nhật `properties` và `selectedProperty`.
- `frontend/src/App.jsx:305–328`: yêu thích/so sánh lưu toàn bộ object của tin.
- `frontend/src/App.jsx:331–349`: mở trực tiếp object được truyền vào rồi ghi lịch sử.
- `frontend/src/App.jsx:903–915`: danh sách yêu thích hiển thị snapshot cũ và truyền snapshot đó vào hàm mở chi tiết.
- `frontend/src/App.jsx:509–511`, `889–903`, `946`, `951`: số đếm và các component vẫn dùng danh sách snapshot.
- `frontend/src/components/CompareDrawer.jsx:43–46`: bảng và nút chi tiết dùng object cũ.

**Thay đổi nhỏ đề xuất:** lưu định danh lựa chọn, lấy nội dung hiển thị từ public catalog hiện tại. Giữ mã yêu thích khi tin tạm ẩn để việc khôi phục tin không làm mất lựa chọn của người dùng; không hiển thị nội dung snapshot của tin không còn khả dụng. Tập so sánh có thể dùng cùng cách chiếu dữ liệu, hoặc xóa lựa chọn không khả dụng sau mỗi lần tải catalog thành công nếu đó là quy tắc sản phẩm.

Thêm vào `App.jsx` sau khai báo trạng thái các danh sách:

```jsx
const publicByCode = useMemo(
  () => new Map(filterCatalog(properties).map(p => [p.code, p])),
  [properties]
);
const resolveCurrent = p => publicByCode.get(p?.code) ?? null;
const currentFavorites = favorites.flatMap(p => {
  const current = resolveCurrent(p);
  return current ? [current] : [];
});
const currentCompared = comparedList.flatMap(p => {
  const current = resolveCurrent(p);
  return current ? [current] : [];
});
```

Dùng `currentFavorites` cho nội dung và số đếm yêu thích; dùng `currentCompared` cho bảng, số đếm và prop `comparedList` của `RecentViewsModal`. Kiểm tra giới hạn 4 trên tập so sánh khả dụng nếu vẫn giữ các mã không khả dụng trong state. Không thay điều kiện `isFavorite` bằng snapshot: định danh `code` vẫn là khóa duy nhất.

Ở đầu `handleSelectProperty`, chuẩn hóa đối tượng trước mọi thay đổi trạng thái/lịch sử:

```jsx
const handleSelectProperty = input => {
  const prop = resolveCurrent(input);
  if (!prop) {
    setSelectedProperty(null);
    alert('Tin đăng hiện không còn khả dụng.');
    return;
  }
  // Giữ phần hiện tại từ setSelectedProperty(prop) trở xuống.
};
```

`handleToggleCompare` chỉ thêm tin qua `resolveCurrent`; khi bỏ chọn cần tiếp tục tìm theo mã để vẫn bỏ được lựa chọn không khả dụng. Khi thêm yêu thích chỉ cần lưu `{ code: prop.code }`, lịch sử chỉ cần `{ code: prop.code, viewed_at: nowIso }`. Nếu cần thẻ “Tin không còn khả dụng”, chỉ hiển thị mã và nút bỏ lưu, không tiêu đề/ảnh/điện thoại từ snapshot cũ.

**Giới hạn:** đây là catalog công khai đã tải gần nhất, có độ trễ polling hiện tại 5 giây (`propertyCatalog.js:108–129`). Không được coi lớp UI này là kiểm soát quyền truy cập. Backend vẫn phải từ chối tin hạn chế tại mọi endpoint. Nếu cần bảo đảm kiểm tra trạng thái ở đúng thời điểm bấm, bổ sung public detail endpoint kiểm tra status/expiry/deleted rồi mới mở; hiện không có route public detail trong source đã đọc. Cần chặn response mở chi tiết đến muộn khi người dùng đã đóng/chuyển tin.

**Đánh đổi:** giữ mã yêu thích giúp phục hồi lựa chọn sau soft restore; chỉ hiển thị tin khả dụng làm số đếm khác số mã đã lưu. Phải chọn rõ số đếm “khả dụng” hoặc thêm một số đếm tin không khả dụng. Không xóa hàng loạt yêu thích khi request catalog lỗi; request lỗi không tương đương catalog rỗng thành công.

**Lưu ý liên quan:** `PropertyModal.jsx:21`, `30`, `510–524` còn có `currentProp` riêng sau khi đổi trạng thái/gia hạn. Nếu tiếp tục dùng local override, phải reset override khi `property.code` hoặc phiên bản tin đổi; nếu không thì một modal có thể nhận dữ liệu catalog mới nhưng tiếp tục render override cũ. Giải pháp gọn là một nguồn dữ liệu `property` ở cha và callback cập nhật/tải lại ở cha; không cần đưa thay đổi này vào bản vá clipboard độc lập.

## 2. Link chia sẻ chỉ tự mở một lần cho lần điều hướng hiện tại

**Điểm sửa hiện tại:** `frontend/src/App.jsx:437–441` chạy `handleSelectProperty` mỗi lần `properties` được thay thế; polling catalog xảy ra định kỳ. Hệ quả source có thể suy ra là modal tự mở lại sau khi đóng, và lịch sử bị ghi lại bởi polling.

Thêm `useRef` vào import React ở dòng 1. Đánh dấu một yêu cầu deep link đã được xử lý sau lần tải catalog **thành công** đầu tiên:

```jsx
const [catalogReady, setCatalogReady] = useState(false);
const initialSharedCode = useRef(
  new URL(window.location.href).searchParams.get('property')
);
const sharedLinkHandled = useRef(false);

// Trong loadData(), ngay sau setProperties(result.data):
setCatalogReady(true);

// Thay effect App.jsx:437–441:
useEffect(() => {
  if (!catalogReady || sharedLinkHandled.current) return;
  sharedLinkHandled.current = true;
  const code = initialSharedCode.current;
  if (!code) return;
  const property = publicByCode.get(code);
  if (property) handleSelectProperty(property);
  else alert('Tin đăng hiện không còn khả dụng.');
}, [catalogReady, publicByCode]);
```

Giữ nguyên query URL để người dùng vẫn có thể copy URL trên thanh địa chỉ. Request lỗi không đặt `catalogReady`, vì vậy retry thành công vẫn có thể mở deep link. Catalog rỗng thành công hoàn tất xử lý và báo không khả dụng một lần. React StrictMode không được tạo thêm lượt ghi lịch sử.

**Đánh đổi:** đoạn tối thiểu xử lý deep link khi tải trang, phù hợp cách hiện tại. Nếu ứng dụng cần hỗ trợ đổi query bằng Back/Forward mà không reload, thêm `popstate` và một mã yêu cầu điều hướng riêng; không reset cờ bởi catalog polling. Nếu chuyển sang kiểm tra server bất đồng bộ khi mở chi tiết, phải hủy/loại response cũ khi người dùng đóng modal.

## 3. Clipboard chỉ báo thành công sau khi sao chép thật

**Điểm sửa hiện tại:**

- `frontend/src/components/PropertyCard.jsx:18–25`: không await/catch `writeText`; bật thông báo thành công ngay khi Promise có thể chưa thành công.
- `PropertyCard.jsx:20`: hardcode `/`, làm mất base path nếu triển khai dưới thư mục con.
- `frontend/src/components/PropertyModal.jsx:50–59`: đã await/catch nhưng đang có logic URL riêng và giữ hash hiện tại.
- `frontend/src/utils/propertyCatalog.js:159–169`: đã có helper `shareListing`, giữ pathname và encode qua URLSearchParams, xóa hash, fallback prompt và trả boolean.

Tái sử dụng helper hiện có cho **cả card và modal**. Thêm import và thay hàm ở card:

```jsx
import { shareListing } from '../utils/propertyCatalog';

const handleShare = async e => {
  e.stopPropagation();
  const copiedSuccessfully = await shareListing(property);
  setCopied(copiedSuccessfully);
  if (copiedSuccessfully) setTimeout(() => setCopied(false), 2000);
};
```

Modal dùng cùng helper:

```jsx
const handleShare = async () => {
  const copiedSuccessfully = await shareListing(property);
  setCopied(copiedSuccessfully);
  if (copiedSuccessfully) setTimeout(() => setCopied(false), 2500);
};
```

Helper hiện tại giữ các query khác. Nếu URL có tham số màn hình riêng như `mode=admin`/`modal=profile`, dùng một canonical URL chỉ giữ pathname và mã tin:

```js
const url = new URL(window.location.pathname, window.location.origin);
url.searchParams.set('property', property.code);
```

Chỉ dùng `property.code`: deep link hiện tại tìm bằng code (`App.jsx:438–440`), không có nhánh tìm theo ID. Nếu thiếu code thì báo không tạo được link; không tạo URL theo ID rồi giả định trang đích hiểu ID. Quyết định giữ các query tracking hợp lệ có thể bổ sung whitelist riêng.

**Đánh đổi:** fallback prompt cho phép người dùng tự copy nhưng không thể xác nhận clipboard đã thay đổi; helper phải trả `false` và UI không báo “Đã chép”. Nếu bỏ prompt vì UX, thay bằng ô link chọn sẵn cùng thông báo rõ; không đổi ý nghĩa boolean thành “đã mở hộp chia sẻ”.

## 4. Tách dữ liệu theo tài khoản và tải lịch sử lại khi định danh thay đổi

**Điểm sửa hiện tại:**

- `App.jsx:122–135`, `212`, `341`, `356`, `366`: các key `3tv_favorites`/`3tv_recent_views` chung cho mọi người dùng.
- `App.jsx:183–207`: server history chỉ được fetch khi mount, merge local trước server và không sort theo viewed_at.
- `App.jsx:386–407`: login/logout không thay scope và không xóa dữ liệu tương tác khỏi state.
- `frontend/src/services/api.js:152–166`: helper hiện trả `[]` cả khi lỗi; không được dùng `[]` này để xóa lịch sử local hợp lệ.

**Quy tắc đề xuất:** key mới `3tv_favorites:guest`, `3tv_favorites:user:<id>` và tương tự cho lịch sử. Không tự đưa dữ liệu guest vào một tài khoản, không tự gán các key cũ không rõ chủ sở hữu cho tài khoản hiện tại. Khi chưa xác nhận `/api/me`, giữ dữ liệu riêng tư ở trạng thái chưa sẵn sàng; `3tv_user` trong local storage không phải bằng chứng danh tính.

Một hook nhỏ tránh ghi state của tài khoản trước sang key tài khoản sau. Có thể đặt tại `frontend/src/hooks/useScopedPropertyList.js`:

```jsx
import { useCallback, useEffect, useState } from 'react';
import { readPropertyList } from '../utils/property';

const references = items => {
  const seen = new Set();
  return items.filter(p => p?.code && !seen.has(p.code) && seen.add(p.code))
    .map(p => ({ code: p.code, ...(p.viewed_at ? { viewed_at: p.viewed_at } : {}) }));
};
const read = key => key ? references(readPropertyList(key)) : [];

export default function useScopedPropertyList(baseKey, scope) {
  const key = scope ? `${baseKey}:${scope}` : null;
  const [snapshot, setSnapshot] = useState(() => ({ key, items: read(key) }));

  useEffect(() => {
    setSnapshot({ key, items: read(key) });
  }, [key]);

  useEffect(() => {
    if (!key || snapshot.key !== key) return;
    try { localStorage.setItem(key, JSON.stringify(snapshot.items)); }
    catch { /* Tiếp tục dùng state trong phiên; UI có thể báo không lưu được. */ }
  }, [key, snapshot]);

  const update = useCallback(updater => {
    setSnapshot(previous => {
      const items = previous.key === key ? previous.items : read(key);
      const next = typeof updater === 'function' ? updater(items) : updater;
      return { key, items: references(next) };
    });
  }, [key]);

  return [snapshot.key === key ? snapshot.items : [], update];
}
```

Ở `App.jsx`, dùng scope chỉ sau khi xác thực đã kết thúc thành công hoặc server trả 401:

```jsx
const [identityReady, setIdentityReady] = useState(false);
const interactionScope = identityReady
  ? (currentUser?.id ? `user:${currentUser.id}` : 'guest')
  : null;
const [favorites, setFavorites] = useScopedPropertyList('3tv_favorites', interactionScope);
const [recentViews, setRecentViews] = useScopedPropertyList('3tv_recent_views', interactionScope);
```

Xóa các đoạn ghi trực tiếp vào key cũ ở dòng 209–216, 340–344, 355–357, 365–367: hook là nơi lưu duy nhất. Khi clear dùng `setRecentViews([])`. Khi chuyển scope, các danh sách cũ không render trong lúc effect hydrate scope mới. Cũng clear so sánh, đóng modal yêu thích/lịch sử và selected property nếu có dữ liệu ngữ cảnh tài khoản.

Đặt `identityReady=true` sau response hợp lệ của `getMe()`/login. Trong logout, đặt false ngay trước request để không tiếp tục hiện dữ liệu A; sau khi xử lý logout đặt guest. Request `/me` khởi động trước login/logout cần generation token hoặc AbortController để response cũ không đổi lại danh tính. Lỗi mạng xác thực không đồng nghĩa guest: giữ scope null và cho retry. Local scoping không thay thế logout/revoke session đúng ở backend.

Tách fetch history ra effect phụ thuộc scope; bảo vệ response đến muộn bằng cả scope và generation. Ví dụ logic tích hợp (import thêm `useRef`):

```jsx
const scopeRef = useRef(interactionScope);
scopeRef.current = interactionScope;
const historyRevision = useRef(0);

useEffect(() => {
  if (!interactionScope?.startsWith('user:')) return;
  let cancelled = false;
  const scope = interactionScope;
  const revision = historyRevision.current;
  fetchViewHistory().then(serverViews => {
    if (cancelled || scopeRef.current !== scope || historyRevision.current !== revision) return;
    setRecentViews(local => mergeHistory(local, serverViews));
  });
  return () => { cancelled = true; };
}, [interactionScope, setRecentViews]);
```

Tăng `historyRevision.current` ở đầu mọi hành động xem/xóa một mục/xóa toàn bộ để response history tải trước thao tác không khôi phục dữ liệu đã xóa. Nếu bỏ response cũ vì người dùng vừa tương tác, có thể retry sau đó; giải pháp đầy đủ hơn là tombstone có timestamp cho mục đã xóa. Không POST/DELETE history server khi scope là guest/chưa xác nhận.

Merge lấy lần xem mới nhất cho mỗi code, sort mới trước và giới hạn 30:

```js
const viewedTime = item => Date.parse(item.viewed_at) || 0;
function mergeHistory(...lists) {
  const byCode = new Map();
  for (const item of lists.flat()) {
    if (!item?.code) continue;
    const previous = byCode.get(item.code);
    if (!previous || viewedTime(item) > viewedTime(previous)) byCode.set(item.code, item);
  }
  return [...byCode.values()]
    .sort((a, b) => viewedTime(b) - viewedTime(a) || a.code.localeCompare(b.code))
    .slice(0, 30);
}
```

**Đánh đổi và phạm vi còn lại:**

- Không tự migrate key cũ tránh gán dữ liệu người khác cho tài khoản hiện tại, nhưng dữ liệu cũ sẽ không xuất hiện trong UI mới. Có thể cung cấp thao tác nhập dữ liệu theo thiết bị sau khi người dùng chọn rõ.
- Key theo user ngăn hiển thị lẫn dữ liệu trong UI, không mã hóa dữ liệu local storage. Nếu chính sách máy dùng chung yêu cầu xóa dấu vết, xóa key của tài khoản khi logout hoặc chỉ giữ lịch sử riêng trong session/DB. Không thể hứa chống đọc bằng devtools với dữ liệu còn lưu trên cùng thiết bị.
- Đoạn tối thiểu chưa giải quyết sync nhiều tab hoặc offline queue. Nếu cần, lắng nghe storage chỉ với đúng key hiện tại và có quy tắc conflict; không overwrite mù toàn bộ list từ tab cũ.
- `clearViewHistoryApi` hiện nuốt lỗi và trả `fallback_local` (`api.js:173–181`). Scoping không giải quyết DELETE server thất bại rồi reload khôi phục lại history. Phải báo kết quả chỉ xóa local, hoặc lưu tombstone/retry có kiểm soát nếu cần bảo đảm xóa trên mọi thiết bị.
- Cookie backend có thể còn xác thực nếu logout request thất bại. UI phải dừng gửi request riêng của tài khoản cũ; việc đăng xuất server cần được xác nhận ở flow auth riêng.

## Regression cần có trước khi nhận bản vá

Các test sau có thể mock API bằng các response fixture trong browser, không sửa DB thật. Chỉ thay network response của test; không chỉnh response/DOM để tạo ảnh chứng minh lỗi của bản production.

| ID | Tình huống | Bằng chứng cần assert |
|---|---|---|
| INT-R01 | Lưu và so sánh tin, API đổi giá/tiêu đề, chờ một poll | Yêu thích, bảng so sánh và detail cùng giá/tiêu đề hiện tại; không còn snapshot cũ. |
| INT-R02 | Tin đã lưu/so sánh chuyển ẩn/xóa/hết hạn trong response public | Không còn lộ tiêu đề/ảnh/điện thoại snapshot ở UI; click cũ không mở detail hoặc ghi thêm VIEW. Tin khác vẫn mở bình thường. |
| INT-R03 | Request catalog lỗi sau khi đã lưu tin, sau đó phục hồi | Không xóa vĩnh viễn mã đã lưu; không coi network error là catalog rỗng thành công. |
| INT-R04 | Deep link hợp lệ → đóng modal → qua hai chu kỳ poll và focus tab | Modal không tự mở; chỉ một hành động deep-link VIEW, không có VIEW do polling. Poll vẫn cập nhật catalog. |
| INT-R05 | Deep link: tải chậm, request đầu lỗi rồi thành công; code không tồn tại | Tin hợp lệ mở một lần khi dữ liệu sẵn sàng; mã thiếu báo một lần, không loop alert hoặc mở snapshot local. |
| INT-R06 | Clipboard trả Promise reject hoặc không có clipboard, cả card grid/list và modal | Có fallback/link; không hiện “Đã chép”; không unhandled rejection; hủy prompt không bị coi thành công. |
| INT-R07 | Clipboard Promise resolve với app ở path con và URL có hash admin/query profile | Chỉ báo thành công sau resolve; link đúng pathname, code được encode, không kéo UI admin/profile theo nếu chọn canonical whitelist. |
| INT-R08 | A có dữ liệu → logout → B login trên cùng browser, không reload | B không thấy dữ liệu A; guest dùng key guest; không ghi list A vào key B; reload B giữ đúng dữ liệu B. |
| INT-R09 | Response history A bị trì hoãn đến sau khi B login | Response A không cập nhật UI hoặc local storage B; việc fetch history B xảy ra sau khi xác nhận danh tính B. |
| INT-R10 | Cùng code: local timestamp cũ, server mới; 31 code với timestamp khác | Giữ bản mới nhất, sort giảm dần, đúng 30 code, không trùng; timestamp sai không gây crash. |
| INT-R11 | Đang fetch server history → clear một mục/toàn bộ → response cũ đến | Mục đã xóa không tái xuất hiện; nếu DELETE server lỗi, UI/trạng thái sync đúng chính sách đã chọn. |
| INT-R12 | Local storage hỏng/bị chặn; getMe 401 so với network timeout | App không crash; 401 cho guest, timeout không giải phóng dữ liệu riêng dựa vào cached user; không ghi nhầm key. |
| INT-R13 | So sánh thêm 1/2/4/5, chọn trùng và bỏ một mục không còn khả dụng | Giới hạn 4 vẫn đúng, không nhân bản; bỏ chọn hoạt động theo code; số đếm phù hợp quy tắc tin khả dụng. |

Các test hiện có liên quan để cập nhật đúng fixture/key mới: `frontend/tests/history-browser.mjs` (ẩn tin lịch sử), `frontend/tests/catalog-browser.mjs` (clipboard **chỉ modal**, persistence theo key cũ), `frontend/tests/database-refresh-browser.mjs` (refresh catalog), `frontend/tests/compare-browser.ps1` (layout/toggle). Chúng chưa chứng minh các regression trên đã được kiểm tra đầy đủ. Sau khi thêm regression đúng mục tiêu, chạy build frontend và các test bị tác động; không chạy script seed/migrate hoặc test ghi DB thật để kiểm tra các bản vá UI này.
