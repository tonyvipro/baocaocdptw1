# Đề xuất sửa backend sau QA ngày 08/11/2026

Đây là tài liệu đề xuất có thể review, không phải bản vá đã áp dụng. Không sửa ứng dụng, không tạo/chạy migration và không thử hard delete hồ sơ tài chính trên DB đang chạy. Các mốc dòng dưới đây tham chiếu source tại thời điểm audit; tên file nằm trong thư mục `backend/`.

## 1. Chặn dữ liệu quản trị công khai; thống nhất session và Bearer token

**Đã xác nhận HTTP live:** guest dùng `admin=1` lấy được tin QA chờ duyệt và ẩn; `/api/properties/stats` trả 200 kèm tên DB qua header; admin có Bearer token hợp lệ nhưng không có cookie bị trả 401 khi đọc trash.

**Điểm sửa hiện tại:** `routes/web.php:194` chuyển nhánh bằng query; `app/Http/Controllers/PropertyReadController.php:50` không kiểm tra quyền; `:98` không kiểm tra quyền cho stats, `:117` đưa tên DB vào header. `PropertyManagementController.php:16,108,122,123,140`, `PropertyTypeController.php:15` và `PropertyReadController.php:33` dùng web user thay vì actor được xác thực thống nhất.

Đề xuất helper nhỏ mới `app/Support/RequestActor.php`, theo cùng cách nhận diện session/token đang dùng ở `/api/me`. Không lấy danh tính hoặc vai trò từ payload/query.

```php
<?php
namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

final class RequestActor
{
    public static function active(Request $request): User
    {
        $user = $request->user('sanctum') ?? $request->user();
        abort_unless($user && $user->is_active, 401, 'Vui lòng đăng nhập lại.');
        return $user;
    }

    public static function admin(Request $request): User
    {
        $user = self::active($request);
        abort_unless((int) $user->role_id === 1, 403, 'Bạn không có quyền quản trị.');
        return $user;
    }
}
```

Trong `PropertyReadController`, import helper và chặn ngay đầu hai hàm, trước truy vấn:

```php
use App\Support\RequestActor;

public function index(Request $request)
{
    RequestActor::admin($request);
    // Giữ phần truy vấn và envelope hiện tại.
}

public function stats(Request $request)
{
    RequestActor::admin($request);
    // Giữ phần thống kê; bỏ ->header('X-Database-Name', ...).
}
```

Giữ `/api/properties` public và định dạng response hiện có. Nhánh `admin=1` chỉ chọn kiểu xem, không cấp quyền. Với `all=true`/`mine=true`, lấy `$actor = RequestActor::active($request)` rồi lọc duy nhất `user_id = $actor->id`.

Trong `PropertyManagementController`, thay actor ở **tất cả** nơi liệt kê trên bằng `RequestActor::active($request)`, gồm chủ tin, ép trạng thái của poster và người ghi audit; không chỉ sửa một hàm authorize. Giữ nguyên kiểm tra sở hữu trong `authorizeProperty()`:

```php
$user = RequestActor::active($request);
$admin = (int) $user->role_id === 1;
abort_unless(
    $admin || (!$adminOnly && (!$property || (int) $property->user_id === (int) $user->id)),
    403,
    'Bạn không có quyền quản lý tin này.'
);
```

Trong `PropertyTypeController::authorizeWrite()`, dùng `RequestActor::admin($request)`. Có thể thay helper bằng middleware chung, nhưng middleware phải làm controller/audit dùng cùng actor; chỉ thêm kiểm tra token ở route trong khi controller tiếp tục đọc web user sẽ chưa sửa đủ.

**Kiểm tra lại:** guest 401; tài khoản thường 403 đối với admin list/stats/trash; admin session và admin token-only cùng 200; owner token-only được thao tác đúng tin của mình và 403 với tin người khác; token hết hạn/thu hồi/actor bị khóa không được cấp quyền. Kiểm thử thêm cookie/token của hai người khác nhau theo quy tắc ưu tiên session của Sanctum hiện tại, tránh ghi audit dưới danh tính khác với actor authorize. Xóa assertion cũ mặc định cho guest đọc admin list; cập nhật `AdminPropertyListingTest` đăng nhập admin cho các happy path và thêm case guest bị từ chối.

## 2. Lưu lý do từ chối và phân biệt reject với hide

**Đã xác nhận HTTP live:** reject có lý do thành công nhưng lý do không có trong dữ liệu property khi đọc lại; bulk `action=reject` không có lý do vẫn trả 200. JSON live không có khóa `rejection_reason`.

**Bằng chứng source:** `PropertyManagementController.php:174-182` nhận reason nhưng không ghi `rejection_reason`; `:193` chỉ lưu trong audit. `:208-211` gộp reject và hide vào status=4. `frontend/src/components/ChangePropertyStatusModal.jsx:109,202` đọc trường `rejection_reason` và cập nhật lạc quan nên refresh mới làm lộ việc không persist.

**Schema cần xác minh trước:** source migration `database/migrations/2026_09_30_000005_create_properties_table.php:64` đã khai báo cột `rejection_reason`. Việc khóa này vắng trong JSON live gợi ý schema/deployment drift hoặc khác biệt serialization; **chưa xác nhận DB live thiếu cột**. Kiểm tra read-only bằng `SHOW COLUMNS FROM properties LIKE 'rejection_reason';` và đối chiếu version deployment trước khi chọn migration. Không sửa migration ban đầu vốn có thể đã chạy.

Nếu introspection xác nhận thiếu cột, tạo migration bổ sung mới, ví dụ phần `up()` sau; đoạn mã này chỉ để review:

```php
public function up(): void
{
    if (!Schema::hasColumn('properties', 'rejection_reason')) {
        Schema::table('properties', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable();
        });
    }
}
// Không tự drop cột trong down(): môi trường khác có thể đã có cột từ migration cũ.
// Chính sách rollback giữ dữ liệu cần được ghi rõ trong migration bổ sung.
```

Contract tương thích cho quick hide:

- `PATCH /api/properties/{id}/status` với `{status:4}` là **hide**.
- Reject gửi `{status:4, moderation_action:"reject", reason:"Lý do cụ thể"}`; reason không được rỗng/toàn khoảng trắng.
- Bulk `action=reject` phải chuyển tiếp `moderation_action=reject`; bulk hide chuyển tiếp `moderation_action=hide`.
- Audit lưu `moderation_action`; property lưu `rejection_reason` cho reject. Khi duyệt hoặc poster sửa/gửi lại tin, xóa lý do từ chối hiện hành; audit cũ vẫn giữ nguyên.

Thay logic status tại `PropertyManagementController.php:174-182`, trong transaction đã lock property, bằng phần xử lý tương đương sau. Giữ quy tắc expiry hiện có sau đoạn này:

```php
$data = $request->validate([
    'status' => 'required|integer|between:0,4',
    'moderation_action' => 'sometimes|in:hide,reject',
    'reason' => 'nullable|string|max:250',
    'expire_days' => 'nullable|integer|between:1,3650',
]);
$target = (int) $data['status'];
abort_if(isset($data['moderation_action']) && $target !== 4, 422,
    'Thao tác từ chối/ẩn phải có trạng thái 4.');
$operation = $target === 4 ? ($data['moderation_action'] ?? 'hide') : null;
$reason = trim($data['reason'] ?? '');
if ($operation === 'reject' && $reason === '') {
    throw \Illuminate\Validation\ValidationException::withMessages([
        'reason' => 'Vui lòng nhập lý do từ chối.',
    ]);
}
if ($operation === 'hide' && $reason === '') $reason = 'Tạm ẩn bài đăng.';
$property->status = $target;
$property->rejection_reason = $operation === 'reject' ? $reason : null;
$request->merge(['reason' => $reason, 'moderation_action' => $operation]);
// Tính expire_date theo quy tắc hiện tại rồi save() và ghi audit trong transaction.
```

Giới hạn 250 ở snippet là giới hạn thực tế của `ValidateInputPolicy`; controller hiện ghi max2000 nhưng middleware toàn cục chặn từ ký tự 251. Nếu sản phẩm muốn 2000, phải sửa chính sách trường reason/note đồng bộ, không chỉ sửa controller.

Trước khi chuẩn hóa `$action` trong `bulk()` tại dòng 211:

```php
if (in_array($action, ['hide', 'reject'], true)) {
    $request->merge(['moderation_action' => $action]);
}
```

Thêm `'moderation_action'` vào `$request->only(...)` của audit tại dòng 193. Sửa frontend reject để gửi operation rõ ràng và lấy property từ response server. Để tránh đường vòng bỏ qua điều kiện reason/revision, chuyển thay đổi trạng thái từ form sửa tin sang endpoint status; không để `PUT /properties/{id}` tùy ý thay status của admin. Có thể đổi rule status của update thành `prohibited` khi frontend đã được cập nhật cùng đợt.

Thông báo duyệt/từ chối cần được dispatch **sau commit**, gửi cho `property.user_id` và deduplicate theo `property_id + revision + operation`; lỗi notification không được làm client hiểu rằng trạng thái đã rollback. Đây là phần workflow còn thiếu trong source, chưa được chứng minh bằng kiểm tra inbox live của lần QA này.

**Kiểm tra lại:** reject thiếu/trắng reason 422 không đổi tin/audit; reject hợp lệ tồn tại sau GET/refresh; hide không reason vẫn thành công; approve hoặc resubmit xóa lý do hiện hành; bulk có một item không hợp lệ rollback toàn bộ; lý do và thông báo chỉ đến đúng chủ tin.

## 3. Chặn hard delete làm mất hợp đồng và hồ sơ tài chính

**Source-only, không thực thi thử:** `PropertyManagementController.php:167-169` hard delete không kiểm tra liên kết. Migration nguồn đặt cascade property → contracts (`2026_09_30_000012_create_contracts_table.php:39`) → invoices (`2026_09_30_000015_create_invoices_table.php:22`) → transactions (`2026_09_30_000017_create_transactions_table.php:20`). Chưa introspect FK live và chưa xác nhận mất dữ liệu qua HTTP.

Sửa tối thiểu trong nhánh `force_delete`, sau kiểm tra trashed và trước `forceDelete()`. Dùng query builder để bao gồm cả hợp đồng soft-deleted:

```php
abort_if(
    DB::table('contracts')->where('property_id', $property->id)->exists(),
    409,
    'Không thể xóa vĩnh viễn bất động sản đã có hồ sơ hợp đồng.'
);
$property->forceDelete();
```

Giữ kiểm tra này trong transaction hiện tại đang lock property. Bổ sung FK restrict bằng **migration mới** để chặn cả race, bulk hoặc đường xóa khác; trước đó xác minh FK/tên constraint thực tế và dữ liệu liên kết trên bản sao DB:

```php
Schema::table('contracts', function (Blueprint $table) {
    $table->dropForeign(['property_id']);
    $table->foreign('property_id')->references('id')->on('properties')->restrictOnDelete();
});
```

Không đổi cascade ảnh/yêu thích theo suy đoán; các quan hệ này có thể được dọn theo chính sách hard delete. Không dùng việc xóa/soft-delete hợp đồng để vượt chặn. Nếu nghiệp vụ cần loại bỏ tài sản có lịch sử, thiết kế archive/snapshot và retention riêng; không cascade chứng từ tài chính. Khi xử lý lỗi FK 1451, trả conflict nghiệp vụ rõ ràng, không lộ SQL.

**Kiểm tra trên DB test:** hard delete tin QA không có hợp đồng thành công; có hợp đồng đang hoạt động/đã kết thúc/soft-deleted đều 409 và giữ nguyên số lượng hợp đồng, hóa đơn, giao dịch, chứng từ; cạnh tranh tạo hợp đồng với hard delete không tạo orphan hoặc xóa hồ sơ tài chính. SQLite regression không thay thế kiểm tra FK/race trên MySQL staging.

## 4. Gắn phê duyệt với revision moderator đã xem

**Source-only:** update đọc property trước transaction ở `PropertyManagementController.php:136-143`; status chỉ có ID và trạng thái tại `:174-182`. `lockForUpdate()` tại `:161` tuần tự hóa request nhưng không chứng minh moderator đang duyệt đúng bản nội dung đã đọc. Không chạy race test live.

Đề xuất thêm `properties.version` bằng migration mới sau khi introspect schema; trả version trong management list/form. `updated_at` độ chính xác giây không đủ cho hai lần sửa cùng giây.

```php
if (!Schema::hasColumn('properties', 'version')) {
    Schema::table('properties', function (Blueprint $table) {
        $table->unsignedBigInteger('version')->default(1);
    });
}
// Thêm cast 'version' => 'integer' trong Property::casts().
```

Trong `update()`, chuyển việc `findOrFail()`, authorize, pricing và ghi dữ liệu vào cùng transaction. Client gửi `expected_version`; loại metadata này khỏi dữ liệu fill:

```php
$expected = $request->validate([
    'expected_version' => 'required|integer|min:1',
])['expected_version'];
$property = DB::transaction(function () use ($request, $validated, $expected) {
    $property = Property::lockForUpdate()->findOrFail($request->route('id'));
    $this->authorizeProperty($request, $property);
    abort_if((int) $property->version !== (int) $expected, 409,
        'Tin đã thay đổi. Vui lòng tải lại nội dung trước khi sửa.');
    $old = $property->toArray();
    $data = $this->pricing($validated, $property);
    // Giữ xử lý blank image hiện tại và không nhận status tùy ý qua update.
    if ((int) RequestActor::active($request)->role_id !== 1) {
        $data['status'] = 0;
        $data['rejection_reason'] = null;
    }
    $property->fill($this->assignType($data));
    $property->version = (int) $property->version + 1;
    $property->save();
    $this->log($request, $property, 'UPDATE', $old);
    // Giữ STATUS audit khi status thay đổi theo logic hiện tại.
    return $property;
});
```

Trong `change()`, sau lock + authorize và **trước mọi mutation**, kiểm tra version với các thao tác chỉnh trạng thái, bao gồm approve/show/hide/reject. Client không được bỏ version để dùng lại nhánh cũ:

```php
if ($action === 'status') {
    $expected = $request->validate([
        'expected_version' => 'required|integer|min:1',
    ])['expected_version'];
    abort_if((int) $property->version !== (int) $expected, 409,
        'Nội dung đã thay đổi. Vui lòng xem lại trước khi phê duyệt.');
}
```

Sau mỗi mutation còn giữ row, tăng version và persist **trong transaction, trước log/response**; không tăng version trong GET. Bump cả update, status, extend, delete và restore để các form cũ không tác động trên trạng thái mới. Với soft delete, bảo đảm version được ghi thực sự: `SoftDeletes` tự cập nhật một số cột, không mặc định lưu mọi thuộc tính dirty. Force delete không còn row để tăng version.

Bulk cần gửi map `{versions:{"123":7,"124":9}}`, validate đủ version cho từng ID rồi chuyển expected_version tương ứng vào mỗi lần `change()`. Thiếu/sai một version trả 409 và rollback toàn bộ. Không dùng một version chung cho nhiều tin, và không cho request single hoặc bulk né kiểm tra.

Các writer khác cũng phải tham gia: đổi tên danh mục đang dùng bulk `update()` tại `PropertyTypeController.php:48`; service đồng bộ khả dụng có thể save status; script/admin cập nhật trực tiếp cũng phải tăng version của tin bị ảnh hưởng nếu thay nội dung/trạng thái moderator đã xem. Nếu chỉ vá hai endpoint trên thì chưa bảo đảm revision trên toàn hệ thống. Không chỉ dùng model observer vì bulk SQL bỏ qua model event.

**Kiểm tra trên DB test:** moderator mở v1, poster lưu v2, duyệt v1 nhận 409 và giữ pending v2; moderator đọc v2 rồi duyệt đúng v2 thành công; hai moderator duyệt/từ chối cùng version chỉ một người thành công; sai version không sinh notification hoặc audit thành công; giữ kiểm tra sở hữu và phân quyền trước khi áp dụng mutation. Dùng MySQL staging để kiểm tra lock và race thực tế.

## Giới hạn bằng chứng hiện tại

- Regression hiện có: 41 tests / 352 assertions PASS trên SQLite `:memory:`; log tại `backend-regression.txt`. Đây là baseline trước sửa và có test đang cho guest đọc admin list, nên PASS không bác bỏ lỗi quyền đã xác nhận live.
- Meilisearch/Elasticsearch trong regression dùng mock; chưa chứng minh đồng bộ nhà cung cấp tìm kiếm live.
- Các snippet trên là hướng vá tối thiểu theo từng vấn đề; cần tích hợp thành một changeset có cập nhật contract frontend/test. Chưa áp dụng, chưa build và chưa chạy kiểm thử cho các bản vá đề xuất.
