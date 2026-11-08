# Đề xuất sửa bộ lọc, dữ liệu và bản đồ

Các đoạn dưới đây là đề xuất để review; chưa áp dụng vào mã ứng dụng. Không gọi dịch vụ bản đồ hoặc ghi dữ liệu.

## 1. Khoảng tùy chỉnh chỉ có giá trị tối thiểu

**Lỗi đã tái hiện:** `PropertyFilter.jsx:133,148` chuyển max bỏ trống thành `Infinity`, nhưng `propertyCatalog.js:19` loại upper bound không hữu hạn. Ví dụ BĐS 4 tỷ không khớp `custom:3000000000-Infinity`; diện tích 100 m² không khớp `custom-area:50-Infinity`.

Thay hàm `inRange` trong `frontend/src/utils/propertyCatalog.js` bằng:

```js
function inRange(value, range, prefix = '') {
  if (!range || range === 'all') return true;
  if (value === null || !Number.isFinite(value) || value <= 0) return false;
  if (!range.startsWith(prefix)) return false;

  const parts = range.slice(prefix.length).split('-');
  if (parts.length !== 2 || parts.some(part => part.trim() === '')) return false;
  const low = Number(parts[0]);
  const high = parts[1] === 'Infinity' ? Infinity : Number(parts[1]);
  const validHigh = Number.isFinite(high) || high === Infinity;

  return Number.isFinite(low) && low >= 0 && validHigh && high >= low
    && value >= low && value <= high;
}
```

Giữ nguyên khoảng custom đóng hai đầu và cách xử lý giá 0/không xác định hiện tại. Max trống biểu diễn một khoảng không có giới hạn trên; vẫn từ chối NaN, số âm và min > max.

Các assertion cần bổ sung vào regression sau khi sửa:

```js
assert.equal(priceMatches({ purpose: 'sale', price: 4e9 }, 'custom:3000000000-Infinity'), true);
assert.equal(priceMatches({ purpose: 'sale', price: 2e9 }, 'custom:3000000000-Infinity'), false);
assert.equal(areaMatches({ area: 100 }, 'custom-area:50-Infinity'), true);
assert.equal(areaMatches({ area: 49.99 }, 'custom-area:50-Infinity'), false);
assert.equal(areaMatches({ area: 50 }, 'custom-area:50-50'), true);
assert.equal(areaMatches({ area: 100 }, 'custom-area:50-NaN'), false);
```

## 2. Bản đồ chi tiết dùng cùng tọa độ với bản đồ danh sách

**Lỗi từ source:** `PropertyModal.jsx:430` geocode tên quận/thành phố, còn `MapView.jsx:52` dùng lat/lng của BĐS. Link mở ngoài tại `PropertyModal.jsx:413` dùng một địa chỉ khác nữa.

Trong `frontend/src/components/PropertyModal.jsx`, thêm import:

```js
import { validCoordinates } from '../utils/property';
```

Sau dòng `const prop = currentProp || property;`, tạo một query chung:

```js
const addressQuery = [prop.street || prop.address, prop.district, prop.city]
  .filter(value => typeof value === 'string' && value.trim())
  .join(', ');
const mapQuery = validCoordinates(prop)
  ? `${Number(prop.lat)},${Number(prop.lng)}`
  : addressQuery ? `${addressQuery}, Vietnam` : '';
const mapHref = mapQuery
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
  : null;
const mapEmbedSrc = mapQuery
  ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
  : null;
```

Thay link mở bản đồ và iframe hiện tại bằng các phần tử dùng hai biến trên, giữ các class layout hiện có:

```jsx
{mapHref && (
  <a href={mapHref} target="_blank" rel="noreferrer">Mở Google Maps</a>
)}

{mapEmbedSrc ? (
  <iframe
    title="Bản đồ vị trí"
    src={mapEmbedSrc}
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
  />
) : (
  <p>Chưa có thông tin vị trí bản đồ.</p>
)}
```

Tọa độ hợp lệ được ưu tiên; địa chỉ đầy đủ là fallback khi chưa có tọa độ; thiếu cả hai hiển thị trạng thái trống. Snippet này chưa thực hiện kiểm tra polygon vùng phục vụ hay cơ chế báo lỗi tile/iframe. Cần kiểm tra riêng những yêu cầu đó.

Kiểm chứng sau khi sửa: cùng một BĐS từ map và chi tiết phải tạo query tọa độ giống nhau; kiểm tra lat/lng dạng chuỗi, tọa độ thiếu/ngoài miền, địa chỉ thiếu, ký tự có dấu; quan sát vị trí thật trong môi trường được phép truy cập provider.

## 3. Giá phải phân biệt thiếu dữ liệu và thỏa thuận

**Bằng chứng live do đợt kiểm tra chính ghi nhận:** bỏ toàn bộ giá vẫn tạo được tin 201 với `price=0`. Điểm sửa là [PropertyManagementController.php:29](../../backend/app/Http/Controllers/PropertyManagementController.php#L29) và fallback `?? 0` tại [dòng 81](../../backend/app/Http/Controllers/PropertyManagementController.php#L81).

Đề xuất thêm trường `price_mode` với hai giá trị `fixed` / `negotiable`. Không tự suy diễn giá thiếu hoặc số 0 thành thỏa thuận. Nếu sản phẩm cho phép BĐS miễn phí, cần trạng thái riêng và quy tắc đã xác nhận; không gộp vào `negotiable`.

Ví dụ invariant thay cho fallback về 0; đoạn này được chạy sau validation số hiện có trong helper `pricing`:

```php
use Illuminate\Validation\ValidationException;

$purpose = $data['purpose'] ?? $property?->purpose;
$field = $purpose === 'rent' ? 'price_rent' : 'price_sale';
$purposeChanged = $property && $purpose !== $property->purpose;
$submittedAmount = array_key_exists('price', $data) || array_key_exists($field, $data);
$mode = $data['price_mode'] ?? $property?->price_mode;

// Cầu nối cho client cũ: chỉ một số dương được gửi rõ ràng mới suy ra fixed.
if ($mode === null && $submittedAmount) $mode = 'fixed';
if (!in_array($mode, ['fixed', 'negotiable'], true)) {
    throw ValidationException::withMessages(['price_mode' => 'Chọn giá cố định hoặc thỏa thuận.']);
}
if ($purposeChanged && !$submittedAmount && !array_key_exists('price_mode', $data)) {
    throw ValidationException::withMessages(['price' => 'Nhập lại mức giá khi đổi bán/cho thuê.']);
}

$amount = array_key_exists('price', $data) ? $data['price']
    : ($data[$field] ?? ($purposeChanged ? null : $property?->price));
if ($mode === 'fixed' && ($amount === null || (float) $amount <= 0)) {
    throw ValidationException::withMessages(['price' => 'Giá cố định phải lớn hơn 0.']);
}
if ($mode === 'negotiable' && $submittedAmount && $amount !== null && (float) $amount !== 0.0) {
    throw ValidationException::withMessages(['price' => 'Tin thỏa thuận không gửi kèm mức giá cố định.']);
}
$amount = $mode === 'negotiable' ? null : $amount;
$data['price_mode'] = $mode;
$data['price'] = $amount;
$data[$field] = $amount;
$data[$purpose === 'rent' ? 'price_sale' : 'price_rent'] = null;
```

Phần triển khai đi kèm:

- Validate `price_mode` bằng `Rule::in(['fixed', 'negotiable'])`; giữ kiểm tra số thập phân, 2 chữ số, giới hạn giá hiện tại. Giá nhập không hợp lệ phải 422 trước invariant trên.
- Nếu client gửi đồng thời `price` và alias tương ứng, từ chối hai giá trị khác nhau sau chuẩn hóa decimal; không âm thầm ưu tiên một giá trị. Khi UPDATE không liên quan giá và không đổi purpose, giữ nguyên giá/mode của bản ghi.
- Cần migration thêm `price_mode`, cho canonical `price` nhận NULL với tin thỏa thuận, và backfill số dương thành fixed. Dữ liệu cũ giá 0 phải được rà soát, không tự gán thỏa thuận. Snippet chưa thể áp dụng trực tiếp nếu chưa có migration này.
- Giữ các tên request/response `price`, `price_sale`, `price_rent`, các trường `_text` và đơn vị bán/tổng, thuê/tháng; `_text='Thỏa thuận'` khi negotiable. Cập nhật `PropertyPrice`, public Resource, model searchable và UI cùng đợt để không ép NULL thành `0 đồng`. `propertyPrice()` hiện đã đưa giá không dương về NULL, nhưng không đủ để phân biệt thỏa thuận với thiếu dữ liệu.
- Không thay response array công khai, envelope quản trị hay route hiện có trong đợt sửa validation.

## 4. Danh mục phải tồn tại và đang hoạt động

**Bằng chứng live chính:** chuỗi loại tự tạo không tồn tại được nhận 201, `property_type_id=null`. Hiện [rules:27,33](../../backend/app/Http/Controllers/PropertyManagementController.php#L27) và [assignType:94–101](../../backend/app/Http/Controllers/PropertyManagementController.php#L94) cho phép rơi qua khi không tìm thấy loại.

Đổi create để yêu cầu ID hợp lệ hoặc tên legacy ánh xạ chính xác tới một danh mục active. Khuyến nghị UI mới luôn gửi ID. Ví dụ thay phần lookup của `assignType`, chạy trong transaction hiện có:

```php
$hasId = array_key_exists('property_type_id', $data);
$hasName = array_key_exists('type', $data);
if (!$hasId && !$hasName) return $data; // UPDATE không đổi danh mục.

$query = PropertyType::query()->where('status', 1);
$type = $hasId
    ? $query->whereKey($data['property_type_id'])->lockForUpdate()->first()
    : $query->where('name', trim($data['type']))->lockForUpdate()->first();
if (!$type) {
    throw \Illuminate\Validation\ValidationException::withMessages([
        'property_type_id' => 'Chọn loại bất động sản đang hoạt động.',
    ]);
}
if ($hasId && $hasName && trim($data['type']) !== $type->name) {
    throw \Illuminate\Validation\ValidationException::withMessages([
        'type' => 'Tên loại bất động sản không khớp ID đã chọn.',
    ]);
}
$data['property_type_id'] = $type->id;
$data['type'] = $type->name;
```

Ở rules, create dùng `required_without:property_type_id` cho tên legacy, `required_without:type` cho ID; ID dùng `integer` + `Rule::exists('property_types', 'id')->where('status', 1)`. UPDATE chỉ validate các trường được gửi, nhưng vẫn chạy resolver khi ID/tên thay đổi. Không cho gửi NULL để bỏ danh mục bắt buộc. Chuyển dữ liệu cũ có tên không ánh xạ sang hàng chờ rà soát trước khi đặt NOT NULL/FK chặt hơn. Quy tắc active của danh mục cha/con cần theo chính sách phân loại đã chốt.

## 5. Tọa độ đủ cặp và nằm trong polygon cấu hình

**Bằng chứng live chính:** Tokyo và payload chỉ có lat vẫn được nhận 201. [rules:37–38](../../backend/app/Http/Controllers/PropertyManagementController.php#L37) hiện chỉ kiểm tra biên toàn cầu.

Giữ tọa độ optional nếu sản phẩm cho phép địa chỉ chưa ghim. Nếu có một giá trị thì phải có đủ cặp; validate trạng thái cuối cùng của bản ghi khi UPDATE, không làm mất lng đang có do PATCH chỉ sửa lat. Muốn xóa vị trí phải gửi cả hai NULL. Ví dụ invariant sau validation số:

```php
$lat = array_key_exists('lat', $data) ? $data['lat'] : $property?->lat;
$lng = array_key_exists('lng', $data) ? $data['lng'] : $property?->lng;
$hasLat = $lat !== null && $lat !== '';
$hasLng = $lng !== null && $lng !== '';
if ($hasLat !== $hasLng) {
    throw \Illuminate\Validation\ValidationException::withMessages([
        'lat' => 'Vĩ độ và kinh độ phải có đủ cặp.',
        'lng' => 'Vĩ độ và kinh độ phải có đủ cặp.',
    ]);
}
if ($hasLat) {
    // ServiceArea là dependency CẦN TRIỂN KHAI, chưa có trong repository.
    // covers nhận [longitude, latitude] và tính cả điểm trên ranh giới.
    $area = app(\App\Services\ServiceArea::class);
    if (!$area->covers((float) $lng, (float) $lat)) {
        throw \Illuminate\Validation\ValidationException::withMessages([
            'lat' => 'Vị trí nằm ngoài vùng phục vụ của hệ thống.',
        ]);
    }
}
```

`ServiceArea` phải đọc polygon/multipolygon GeoJSON do hệ thống cấu hình, ví dụ `config('real_estate.service_area_geojson')`, từ file nội bộ đã duyệt; không tự suy ra lãnh thổ bằng bounding box hay tạo đường biên từ trí nhớ. Chốt rõ chính sách ranh giới, holes và thứ tự lng/lat. Khi bật enforcement nhưng polygon thiếu/hỏng, báo lỗi cấu hình và không silently accept. UI có thể kiểm tra sớm nhưng API là nơi quyết định. Nếu chỉ cho phép một số tỉnh/thành, polygon phải là đúng vùng đó; lỗi Tokyo cần theo chính sách vùng phục vụ thực tế, không hardcode một tọa độ ngoại lệ.

Không tự đồng bộ `latitude/longitude` và `lat/lng` bằng suy đoán: chọn một cặp canonical, backfill có kiểm tra, giữ alias cần thiết cho client cũ. Ngoài polygon, cần xác minh ghim so với địa chỉ; điểm nằm trong vùng vẫn có thể ghim sai BĐS.

## 6. Mô tả, nội thất và tiện ích phải phản ánh dữ liệu của tin

Nguồn lỗi: danh sách tiện ích hằng tại [PropertyModal.jsx:62–67](../../frontend/src/components/PropertyModal.jsx#L62), render ở [dòng 377](../../frontend/src/components/PropertyModal.jsx#L377); khối [389–402](../../frontend/src/components/PropertyModal.jsx#L389) không hiển thị description thật, lại tự khẳng định nội thất và tiện ích căn hộ. [PostPropertyModal.jsx:25](../../frontend/src/components/PostPropertyModal.jsx#L25) cũng chọn sẵn tiện ích; không dùng lựa chọn mặc định như dữ kiện đã xác minh.

Thay danh sách hằng và khối mô tả bằng dữ liệu của `prop`:

```jsx
const readAmenities = raw => {
  if (Array.isArray(raw)) return raw.filter(item => typeof item === 'string' && item.trim());
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(item => typeof item === 'string' && item.trim());
  } catch { /* Legacy TEXT: giữ nguyên một mục, không phát minh tiện ích. */ }
  return [raw];
};
const amenities = [...new Set(readAmenities(prop.amenities))];
```

```jsx
<p className="whitespace-pre-line">
  {prop.description?.trim() || 'Chưa có mô tả chi tiết.'}
</p>
<p>Tình trạng nội thất: {prop.furniture?.trim() || 'Chưa cập nhật'}</p>
{amenities.length ? (
  <ul>{amenities.map(item => <li key={item}>{item}</li>)}</ul>
) : (
  <p>Chưa cập nhật tiện ích.</p>
)}
```

Render bằng React text, không `dangerouslySetInnerHTML`. Mã API hiện chưa đưa `amenities` vào rules nên phải bổ sung để không bỏ mất lựa chọn từ form:

```php
'amenities' => ['sometimes', 'nullable', 'array', 'max:50'],
'amenities.*' => ['required', 'string', 'max:250', 'distinct'],
```

Sau khi chuyển dữ liệu amenities legacy sang JSON array có kiểm tra, thêm cast `'amenities' => 'array'` trong `Property::casts()`; TEXT hiện tại vẫn chứa JSON được, chưa cần đổi kiểu cột ngay. Những chuỗi legacy không phải JSON phải được bảo toàn thành phần tử thực tế, không gán danh sách mẫu. Giữ giới hạn description 250 hiện tại cho tới khi thay đổi đồng bộ global input policy, metadata và UI.

## 7. Giới hạn kết luận và tính tương thích

- Kiểm tra live chính **đã PASS** round-trip diện tích `99999999.99` với giá trị đọc lại đúng `99999999.99` ([live-results.json](./live-results.json), case AREA precision). Kiểu FLOAT trong migration là điểm cần theo dõi, **chưa phải lỗi mất chính xác đã tái hiện**; không đưa migration diện tích vào fix bắt buộc chỉ từ phát hiện source.
- So sánh SQL `Căn hộ` / `Can ho` trả cùng 22 ID và known ID 2: kiểm chứng folding hợp lệ. IDs 39/40 chưa có ở baseline 38 trước đó là chênh lệch theo thời gian; baseline membership của follow-up được đánh dấu **INCONCLUSIVE**, không báo FAIL chức năng hoặc lộ dữ liệu chỉ vì snapshot cũ. Cả hai response được kiểm tra trạng thái công khai riêng.
- Các thay đổi price mode/category/coordinates cần API validation và migration tương ứng, giữ route, response shape và alias hiện hành trong giai đoạn chuyển tiếp. Tất cả mã trong tài liệu là đề xuất chưa áp dụng.
