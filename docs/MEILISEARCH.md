# Tích hợp Meilisearch: Laravel + React + MySQL + Docker

Tài liệu dành cho chính dự án 3TV Land. Code hoàn chỉnh nằm trong repository và được chép đầy đủ ở cuối tài liệu. Các lệnh Docker dưới đây chạy từ **thư mục gốc dự án**, nơi có `docker-compose.yml`.

## 1. Luồng hoạt động

```text
Người dùng nhập từ khóa
  → React chờ 350 ms sau lần nhập cuối
  → GET /api/search/properties?q=thao+dien&page=1&per_page=8
  → Laravel Scout tìm và xếp hạng ID trong Meilisearch
  → Laravel đọc lại bản ghi MySQL, loại tin ẩn/hết hạn/xóa mềm
  → JSON → React hiển thị kết quả
```

MySQL vẫn là nguồn dữ liệu chính. Meilisearch là chỉ mục phục vụ tìm kiếm. Ô **Tìm kiếm thông minh** trong banner thay thế ô tìm kiếm cũ; kết quả hiển thị trong danh sách chính và kết hợp các bộ lọc dự án, khu vực, mua/thuê, loại BĐS, phòng ngủ, giá, diện tích. Chưa chuyển toàn bộ trang quản trị sang Meilisearch.

Các phiên bản đang dùng: Laravel 13, Scout 11.9, SDK Meilisearch PHP 1.17. Docker pin Meilisearch `v1.55.0`, không dùng tag `latest` để tránh tự đổi phiên bản giữa các lần cài.

## 2. Tạo khóa và phân biệt hai file .env

Chạy:

```powershell
node scripts/setup-meilisearch-env.mjs
```

Script tạo khóa ngẫu nhiên 32 byte, ghi vào `.env` ở thư mục gốc và đồng bộ khóa vào `backend/.env`. Nó giữ nguyên cấu hình database hiện tại và không in khóa ra terminal. Khi chạy lại, khóa đã có được giữ nguyên.

**`.env` ở thư mục gốc** dùng cho Docker Compose:

```dotenv
MEILI_MASTER_KEY=<khóa do script tạo>
```

**`backend/.env`** dùng cho Laravel khi chạy PHP trực tiếp trên Windows:

```dotenv
SCOUT_DRIVER=meilisearch
SCOUT_QUEUE=false
SCOUT_PREFIX=3tvland_
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=<cùng khóa với MEILI_MASTER_KEY>
```

Trong Docker, Compose ghi đè host thành `http://meilisearch:7700`. `localhost` bên trong container chỉ chính container đó, không trỏ tới container Meilisearch. Khóa chỉ dùng ở backend; không đưa khóa vào biến `VITE_*` hoặc code React. Hai file `.env` thật đều đã được gitignore.

## 3. Service Docker

Service đã được thêm vào `docker-compose.yml`:

```yaml
  meilisearch:
    image: getmeili/meilisearch:v1.55.0
    container_name: baocaocdptw1_meilisearch
    restart: unless-stopped
    ports:
      - "127.0.0.1:7700:7700"
    environment:
      MEILI_ENV: production
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:?Set MEILI_MASTER_KEY in the root .env file}
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meili_data:/meili_data
```

Các biến bổ sung trong `backend.environment`:

```yaml
      - SCOUT_DRIVER=meilisearch
      - SCOUT_QUEUE=false
      - MEILISEARCH_HOST=http://meilisearch:7700
      - MEILISEARCH_KEY=${MEILI_MASTER_KEY:?Set MEILI_MASTER_KEY in the root .env file}
```

Thêm `meilisearch` vào `backend.depends_on` và khai báo volume cạnh `db_data`:

```yaml
volumes:
  db_data:
  meili_data:
```

Port 7700 chỉ mở trên máy local; Laravel gọi Meilisearch qua mạng nội bộ Docker. Dữ liệu chỉ mục tồn tại trong named volume qua các lần tạo lại container. `depends_on` chỉ đảm bảo thứ tự khởi động, không đảm bảo dịch vụ sẵn sàng nhận request.

Khởi động:

```powershell
docker compose up -d db meilisearch
Invoke-RestMethod http://localhost:7700/health
```

Health phải trả `status: available` trước khi đồng bộ chỉ mục. Không dùng `docker compose down -v` vì tùy chọn `-v` sẽ xóa cả các volume dữ liệu.

## 4. Cài package Laravel

Trong dự án này, `composer.json` và `composer.lock` đã được cập nhật. Khi lấy source này về máy khác, chỉ cần cài đúng lockfile:

```powershell
docker compose run --rm --no-deps backend composer install --no-interaction
docker compose up -d --no-deps backend
docker compose exec backend php artisan config:clear
```

Nếu tự tích hợp từ dự án chưa có package, dùng:

```powershell
docker compose exec backend composer require laravel/scout meilisearch/meilisearch-php
```

Laravel đã có Guzzle và HTTP factory tương thích. Nếu dự án khác báo thiếu PSR HTTP factory, cài thêm `http-interop/http-factory-guzzle` theo hướng dẫn Laravel Scout chính thức.

`backend/config/scout.php` đã được tạo và tùy chỉnh; không publish đè file này. Với dự án mới hoàn toàn, có thể tạo file ban đầu bằng:

```powershell
docker compose exec backend php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
```

## 5. Model và cấu hình chỉ mục

`Property` đã thêm trait `Laravel\Scout\Searchable` và các hàm:

- `searchableAs()`: chỉ mục `3tvland_properties`.
- `toSearchableArray()`: chỉ đưa các trường phục vụ tìm kiếm vào chỉ mục; giá/diện tích là số, trạng thái và thời điểm là số nguyên. Không index số điện thoại chủ nhà hoặc lý do từ chối nội bộ.
- `shouldBeSearchable()`: chỉ index tin công khai và còn hạn, chưa xóa mềm.
- `scopePubliclyVisible()`: kiểm tra trạng thái hiện tại trong SQL khi lấy kết quả. Scout có thể hydrate bằng truy vấn gồm cả thùng rác nên scope gọi rõ `withoutTrashed()`.

`config/scout.php` khai báo thứ tự `searchableAttributes` để ưu tiên tiêu đề/mã tin/dự án, `filterableAttributes` cho trạng thái và hạn đăng, cùng các trường có thể sắp xếp. Chỉ khai báo sortable chưa tự áp dụng sắp xếp; endpoint hiện ưu tiên thứ hạng liên quan mặc định.

## 6. Import dữ liệu MySQL hiện có

Chạy lần lượt:

```powershell
docker compose exec backend php artisan scout:sync-index-settings
docker compose exec backend php artisan scout:import 'App\Models\Property'
docker compose exec backend php scripts/check-meilisearch.php
```

Không cần seed lại hoặc reset database. Import đọc các bản ghi hiện có và upsert vào Meilisearch theo ID, áp dụng `shouldBeSearchable()`.

Meilisearch xử lý tác vụ ghi bất đồng bộ, kể cả khi `SCOUT_QUEUE=false`. Vì vậy lệnh import hoàn thành có nghĩa dữ liệu đã được gửi; kiểm tra `recent_tasks` có trạng thái `succeeded` và `stats.isIndexing=false` trước khi đánh giá kết quả. Sau khi đổi `filterableAttributes`, chạy lại `scout:sync-index-settings`.

Scout tự theo dõi thao tác tạo/sửa/xóa qua Eloquent. Sửa trực tiếp bằng phpMyAdmin, SQL hoặc `DB::table()->update()` không phát sinh Eloquent event: cần import lại. Import thường không dọn những document cũ không còn đủ điều kiện, nhưng API vẫn lọc chúng theo MySQL. Nếu thực sự cần dựng lại toàn bộ chỉ mục, `scout:flush` rồi import chỉ tác động chỉ mục tìm kiếm, không xóa MySQL; thực hiện vào lúc phù hợp vì kết quả sẽ tạm rỗng.

Ví dụ hiện tại dùng `SCOUT_QUEUE=false` để không cần queue worker. Nếu chuyển `SCOUT_QUEUE=true`, cần worker luôn chạy, ví dụ `php artisan queue:work`; nếu không chỉ mục sẽ không cập nhật. Với production nên dùng hàng đợi và theo dõi failed jobs để sự cố Meilisearch không làm thao tác ghi chờ lâu.

## 7. API và JSON

Endpoint công khai được đăng ký trong **`backend/routes/api.php`**. Laravel tự thêm prefix `/api`; không viết thêm `/api` trong tên route:

```php
Route::get('/search/properties', \App\Http\Controllers\PropertySearchController::class)
    ->middleware('throttle:120,1');
```

Thử bằng PowerShell:

```powershell
Invoke-RestMethod 'http://localhost:3001/api/search/properties?q=thao%20dien&page=1&per_page=8'
Invoke-RestMethod 'http://localhost:3001/api/search/properties?q=vinhomez'
```

JSON ví dụ (minh họa cấu trúc):

```json
{
  "data": [{"id": 1, "code": "EXAMPLE", "title": "Biệt thự Thảo Điền", "price": 2500000000, "price_text": "2.5 tỷ"}],
  "meta": {"query": "thao dien", "current_page": 1, "last_page": 1, "per_page": 8, "total": 1}
}
```

Query `q` tối đa 250 ký tự; `per_page` từ 1–24, `page` từ 1–100. Query rỗng trả `data: []` mà không gọi Meilisearch. Sai dữ liệu trả 422, dịch vụ chưa bật hoặc kết nối/chỉ mục có lỗi trả 503 với thông báo thân thiện, vượt giới hạn request trả 429. API không đổi sang SQL LIKE khi Meilisearch lỗi, để giao diện phản ánh đúng trạng thái dịch vụ.

Ở chế độ phân trang, `meta.total` là tổng số hit Meilisearch báo trong giới hạn `maxTotalHits=1000`. Nếu chỉ mục cũ có tin đã bị ẩn/xóa trong SQL, số bản ghi thực trả có thể ít hơn tổng đó.

Trang chủ gửi thêm `catalog=1`: API trả `data` là danh sách ID đã kiểm tra lại trong SQL, theo thứ tự liên quan, tối đa 1000 kết quả. React đối chiếu với catalog công khai hiện có rồi áp dụng các bộ lọc. Cách này không giới hạn việc lọc vào 8 kết quả đầu tiên và không lọc từ khóa lần nữa bằng so khớp chuỗi, nên kết quả sửa lỗi gõ được giữ nguyên. Với dữ liệu vượt giới hạn 1000 hit, cần chuyển các bộ lọc sang backend và phân trang kết hợp tại đó.

## 8. React và debounce

`frontend/src/services/propertySearch.js` gọi cùng nguồn `/api/search/properties`; Vite ở cổng 3001 và Nginx ở cổng 3000 đã proxy `/api` tới backend. Không cần cấu hình CORS riêng hoặc gửi khóa Meilisearch xuống React.

Hook `usePropertySearch.js` quản lý dữ liệu/loading/lỗi, debounce 350 ms, `AbortController` để hủy request cũ và cờ `active` để ngăn response cũ ghi đè kết quả mới. `PropertySearchBar.jsx` là ô nhập gọn trong banner, có nút xóa và biểu tượng đang tìm. Các trạng thái loading/không tìm thấy/lỗi và nút retry hiển thị trong danh sách chính. Input có label, trạng thái có `role=status`/`role=alert`.

`HeroSection.jsx` thay ô nhập cũ bằng:

```jsx
import PropertySearchBar from './properties/PropertySearchBar';

<PropertySearchBar
  value={searchKeyword}
  onChange={setSearchKeyword}
  isLoading={searchLoading}
/>
```

`App.jsx` dùng hook nhận ID theo thứ hạng, `rankSearchCatalog()` sắp lại catalog, rồi `filterCatalog()` áp dụng các bộ lọc còn lại. Mở `http://localhost:3001/`, nhập `thao dien` hoặc `vinhomez` vào ô banner. Nút Tìm kiếm hoặc phím Enter cuộn xuống danh sách kết quả; xóa từ khóa sẽ khôi phục catalog theo các bộ lọc hiện tại.

Để chạy frontend local:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Với frontend Docker cổng 3000, build lại container để nhận source mới:

```powershell
docker compose up -d --build --no-deps frontend
```

## 9. Kiểm thử và xử lý lỗi

```powershell
docker compose exec backend php vendor/phpunit/phpunit/phpunit --filter PropertyMeilisearchTest --do-not-cache-result
cd frontend
npm.cmd run test:meilisearch
npm.cmd run test:search
npm.cmd run build
```

Các bài PHP ép SQLite `:memory:` và `SCOUT_DRIVER=null` trước khi ứng dụng khởi động. Riêng bài endpoint thay Meilisearch bằng mock; không ghi vào MySQL hoặc chỉ mục thật.

| Hiện tượng | Kiểm tra |
| --- | --- |
| Compose báo chưa có master key | Chạy `node scripts/setup-meilisearch-env.mjs` từ thư mục gốc |
| API trả 503 | Kiểm tra service, host và key; xem log backend và `check-meilisearch.php` |
| `index_not_found` | Chạy sync settings rồi import Property |
| `invalid_search_filter` | Chạy lại sync settings và chờ task succeeded |
| Import xong vẫn rỗng | Kiểm tra driver/database trong script, trạng thái và expire_date của tin, trạng thái task |
| Sửa SQL không cập nhật tìm kiếm | Import lại; SQL trực tiếp không kích hoạt Scout |
| Cổng 3000 chưa thấy ô mới | Build lại riêng frontend Docker; build `frontend/dist` không tự cập nhật Nginx container |
| Các thay đổi Eloquent không xuất hiện | Nếu dùng queue, kiểm tra queue worker; nếu không dùng queue, kiểm tra lỗi kết nối Meilisearch |

Đây là tìm kiếm full-text có sửa lỗi gõ và xếp hạng liên quan. Chưa cấu hình semantic search, embeddings hoặc phân tích câu “2 phòng ngủ dưới 3 tỷ” thành bộ lọc.

## 10. Tài liệu chính thức

- [Laravel Scout 13.x: cài đặt, Meilisearch, model và import](https://laravel.com/docs/13.x/scout)
- [Meilisearch Docker: service, master key và volume](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/docker)
- [Meilisearch PHP SDK](https://github.com/meilisearch/meilisearch-php)

## 11. Toàn bộ code mới và model đã tích hợp

Các đoạn sau là bản đầy đủ của các file nguồn tại thời điểm tích hợp; chỉnh sửa trực tiếp các file tương ứng trong repository khi phát triển tiếp.

### backend/config/scout.php

```php
<?php

use App\Models\Property;

return [
    'driver' => env('SCOUT_DRIVER', 'null'),
    'prefix' => env('SCOUT_PREFIX', '3tvland_'),
    'queue' => env('SCOUT_QUEUE', false),
    'after_commit' => true,
    'chunk' => ['searchable' => 500, 'unsearchable' => 500],
    'soft_delete' => false,
    'identify' => false,

    'meilisearch' => [
        'host' => env('MEILISEARCH_HOST', 'http://127.0.0.1:7700'),
        'key' => env('MEILISEARCH_KEY'),
        'index-settings' => [
            Property::class => [
                'searchableAttributes' => [
                    'title', 'code', 'project', 'address', 'street',
                    'district', 'city', 'developer', 'type',
                ],
                'filterableAttributes' => ['status', 'expires_at', 'purpose', 'city', 'type', 'price', 'area', 'bedrooms'],
                'sortableAttributes' => ['price', 'area', 'created_at'],
                'pagination' => ['maxTotalHits' => 1000],
                'typoTolerance' => ['enabled' => true],
            ],
        ],
    ],
];
```

### backend/app/Models/Property.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Laravel\Scout\Searchable;

class Property extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['status' => 'integer', 'bedrooms' => 'integer', 'bathrooms' => 'integer', 'floors' => 'integer', 'area' => 'float'];
    }

    public function searchableAs(): string
    {
        return config('scout.prefix').'properties';
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => (int) $this->getKey(),
            'code' => (string) $this->code,
            'title' => (string) $this->title,
            'project' => (string) $this->project,
            'address' => (string) $this->address,
            'street' => (string) $this->street,
            'district' => (string) $this->district,
            'city' => (string) $this->city,
            'developer' => (string) $this->developer,
            'type' => (string) $this->type,
            'purpose' => (string) $this->purpose,
            'price' => (float) ($this->price ?? ($this->purpose === 'rent' ? $this->price_rent : $this->price_sale)),
            'area' => (float) $this->area,
            'bedrooms' => (int) $this->bedrooms,
            'status' => (int) $this->status,
            'expires_at' => $this->expire_date ? Carbon::parse($this->expire_date)->timestamp : 0,
            'created_at' => $this->created_at?->timestamp ?? 0,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return !$this->trashed() && $this->status === 1
            && (!$this->expire_date || Carbon::parse($this->expire_date)->greaterThanOrEqualTo(now()));
    }

    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->withoutTrashed()->where('status', 1)
            ->where(fn (Builder $q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function images()
    {
        return $this->hasMany(PropertyImage::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Đánh dấu BĐS đã bán/cho thuê thành công (Chuyển sang trạng thái 2: Đã giao dịch)
     */
    public function markAsSoldOrRented()
    {
        $this->status = 2; // 2 = Đã giao dịch (Bán/Thuê)
        $this->save();
    }
}
```

### backend/app/Support/PropertyPrice.php

```php
<?php

namespace App\Support;

final class PropertyPrice
{
    public static function format(float $price, bool $rent = false): string
    {
        $text = $price >= 1e9 ? round($price / 1e9, 2).' tỷ'
            : ($price >= 1e6 ? round($price / 1e6, 2).' triệu' : number_format($price, 0, ',', '.').' đồng');

        return $text.($rent ? '/tháng' : '');
    }
}
```

### backend/app/Http/Controllers/PropertySearchController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Meilisearch\Endpoints\Indexes;
use Meilisearch\Exceptions\ExceptionInterface;

class PropertySearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $input = $request->validate([
            'q' => ['nullable', 'string', 'max:250'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:24'],
            'catalog' => ['sometimes', 'boolean'],
        ]);
        $text = trim($input['q'] ?? '');
        $perPage = (int) ($input['per_page'] ?? 8);
        $page = (int) ($input['page'] ?? 1);
        if ($text === '') {
            return response()->json(['data' => [], 'meta' => [
                'query' => '', 'current_page' => 1, 'last_page' => 1, 'per_page' => $perPage, 'total' => 0,
            ]]);
        }
        if (config('scout.driver') !== 'meilisearch') {
            return response()->json(['message' => 'Tìm kiếm thông minh chưa được bật trên máy chủ.'], 503);
        }

        try {
            $search = Property::search($text, function (Indexes $index, string $query, array $options) {
                $timestamp = now()->timestamp;
                $options['filter'] = "status = 1 AND (expires_at = 0 OR expires_at >= $timestamp)";

                return $index->search($query, $options);
            })
                // Always recheck SQL: an old index must never expose hidden/expired/deleted listings.
                ->query(fn (Builder $query) => $query->publiclyVisible());

            if ($request->boolean('catalog')) {
                // The catalog already holds public listing data; return all ranked IDs in one request.
                $limit = (int) config('scout.meilisearch.index-settings.'.Property::class.'.pagination.maxTotalHits', 1000);
                $matches = $search->options(['attributesToRetrieve' => ['id']])->take($limit)->get();

                return response()->json([
                    'data' => $matches->modelKeys(),
                    'meta' => ['query' => $text, 'total' => $matches->count(), 'limit' => $limit],
                ])->header('Cache-Control', 'no-store');
            }

            $results = $search->paginate($perPage, 'page', $page);
        } catch (ExceptionInterface $exception) {
            report($exception);

            return response()->json(['message' => 'Dịch vụ tìm kiếm đang tạm gián đoạn. Vui lòng thử lại sau.'], 503);
        }

        return response()->json([
            'data' => $results->getCollection()->map(function (Property $property) {
                // Only public listing fields leave this endpoint; index metadata is never returned.
                $data = $property->only([
                    'id', 'code', 'title', 'description', 'project', 'address', 'street', 'district', 'city',
                    'developer', 'type', 'purpose', 'area', 'bedrooms', 'bathrooms', 'floors', 'image',
                    'direction', 'legal', 'legal_status', 'furniture', 'lat', 'lng', 'created_at', 'status',
                ]);
                $price = (float) ($property->price ?? ($property->purpose === 'rent' ? $property->price_rent : $property->price_sale));
                $data['price'] = $price;
                $data['price_text'] = \App\Support\PropertyPrice::format($price, $property->purpose === 'rent');
                $field = $property->purpose === 'rent' ? 'price_rent' : 'price_sale';
                $data[$field] = $price;
                $data[$field.'_text'] = $data['price_text'];

                return $data;
            })->values(),
            'meta' => [
                'query' => $text,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ])->header('Cache-Control', 'no-store');
    }
}
```

### frontend/src/services/propertySearch.js

```javascript
export async function searchProperties(query, { page = 1, catalog = false, signal, fetcher = fetch } = {}) {
  const params = new URLSearchParams(catalog
    ? { q: query.trim(), catalog: '1' }
    : { q: query.trim(), page: String(page), per_page: '8' });
  const response = await fetcher(`/api/search/properties?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Không thể tải kết quả tìm kiếm. Vui lòng thử lại.');
  }
  if (!Array.isArray(payload?.data) || !payload?.meta || (catalog && !payload.data.every(Number.isInteger))) {
    throw new Error('Máy chủ trả về kết quả tìm kiếm không hợp lệ.');
  }
  return payload;
}

export function rankSearchCatalog(properties, ids) {
  const catalog = new Map(properties.map(property => [String(property.id), property]));
  return ids.map(id => catalog.get(String(id))).filter(Boolean);
}
```

### frontend/src/hooks/usePropertySearch.js

```javascript
import { useCallback, useEffect, useState } from 'react';
import { searchProperties } from '../services/propertySearch';

export default function usePropertySearch(value) {
  const query = value.trim();
  const [state, setState] = useState({ query: '', ids: [], isLoading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(previous => previous + 1), []);

  useEffect(() => {
    if (!query) {
      setState({ query: '', ids: [], isLoading: false, error: '' });
      return;
    }
    const controller = new AbortController();
    let active = true;
    setState({ query, ids: [], isLoading: true, error: '' });
    const timer = setTimeout(async () => {
      try {
        const result = await searchProperties(query, { catalog: true, signal: controller.signal });
        if (active) setState({ query, ids: result.data, isLoading: false, error: '' });
      } catch (cause) {
        if (active && cause.name !== 'AbortError') {
          setState({ query, ids: [], isLoading: false, error: cause.message || 'Không kết nối được máy chủ tìm kiếm.' });
        }
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

  // Hide the previous response immediately, including the render before effect cleanup.
  const current = query && state.query === query ? state : { query, ids: [], isLoading: Boolean(query), error: '' };
  return { ...current, retry };
}
```

### frontend/src/components/properties/PropertySearchBar.jsx

```jsx
import React from 'react';
import { Loader2, Search, X } from 'lucide-react';

export default function PropertySearchBar({ value, onChange, isLoading = false }) {
  return (
    <div>
      <label htmlFor="smart-property-query" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        Tìm kiếm thông minh
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
        <input
          id="smart-property-query"
          type="text"
          maxLength={250}
          value={value}
          onChange={event => onChange(event.target.value.slice(0, 250))}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          aria-describedby="smart-search-hint"
          aria-controls="listing-section"
          aria-busy={isLoading}
          autoComplete="off"
          placeholder="Tên dự án, địa chỉ, mã tin..."
          className="w-full rounded-lg border border-white/25 bg-black/25 py-2.5 pl-9 pr-16 text-sm text-white shadow-inner backdrop-blur-[1px] transition-all placeholder:text-slate-200/70 hover:bg-black/35 focus:border-white/70 focus:bg-black/45 focus:outline-none focus:ring-2 focus:ring-red-500/40"
        />
        {isLoading && <Loader2 aria-hidden="true" size={15} className="absolute right-9 top-1/2 -mt-2 animate-spin text-white/80" />}
        {value && <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { onChange(''); document.getElementById('smart-property-query')?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"><X size={15} /></button>}
      </div>
      <p id="smart-search-hint" className="sr-only">Tìm theo tên dự án, địa chỉ hoặc mã tin. Hỗ trợ không dấu và lỗi gõ nhỏ. Kết quả hiển thị trong danh sách bất động sản bên dưới.</p>
    </div>
  );
}
```

### frontend/src/components/HeroSection.jsx

```jsx
import React from 'react';
import { Search, MapPin, Building, Loader2, Tag } from 'lucide-react';
import PropertySearchBar from './properties/PropertySearchBar';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  selectedProject,
  setSelectedProject,
  selectedType,
  setSelectedType,
  selectedCity,
  setSelectedCity,
  activeTab,
  setActiveTab,
  projectsList,
  citiesList,
  typesList,
  totalResults,
  searchLoading = false,
  searchError = '',
  onRetrySearch
}) {
  const trendingTags = [
    'Vinhomes Central Park',
    'Masteri Thảo Điền',
    'Landmark 81',
    'The Sun Avenue',
    'Safira Khang Điền'
  ];

  return (
    <section className="relative py-16 md:py-24 text-white overflow-hidden border-b border-slate-800">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>
      
      {/* Overlay mờ để làm nổi bật nội dung (Chữ & Search Box) */}
      <div className="absolute inset-0 bg-slate-900/50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Slogan */}
        <div className="max-w-3xl mb-10 drop-shadow-lg">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            Kênh Thông Tin Bất Động Sản & Nhà Đất Uy Tín
          </h1>
          <p className="text-slate-200 text-sm sm:text-lg font-medium drop-shadow-md">
            Tra cứu thông tin bất động sản, dự án căn hộ cao cấp, giá thuê & giá bán chính xác nhất từ chủ đầu tư.
          </p>
        </div>

        {/* Real Estate Search Box (Kính Trong Suốt Nhìn Rõ Video Nền) */}
        <div className="bg-black/15 hover:bg-black/20 backdrop-blur-[2px] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-4 sm:p-6 text-white border border-white/30 transition-all">
          {/* Purpose Tab Bar */}
          <div className="flex items-center gap-1.5 pb-3 mb-4 border-b border-white/15 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'all' 
                  ? 'bg-white/20 text-white shadow-sm border border-white/40' 
                  : 'bg-black/20 text-slate-200 hover:text-white hover:bg-black/40 border border-white/10'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'sale' 
                  ? 'bg-red-600/90 text-white shadow-md shadow-red-600/40 border border-red-400/40' 
                  : 'bg-black/20 text-slate-200 hover:text-red-400 hover:bg-black/40 border border-white/10'
              }`}
            >
              Nhà Đất Bán
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'rent' 
                  ? 'bg-red-600/90 text-white shadow-md shadow-red-600/40 border border-red-400/40' 
                  : 'bg-black/20 text-slate-200 hover:text-red-400 hover:bg-black/40 border border-white/10'
              }`}
            >
              Nhà Đất Cho Thuê
            </button>
          </div>

          {/* Search Inputs Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            
            {/* Input Keyword */}
            <div className="lg:col-span-4">
              <PropertySearchBar value={searchKeyword} onChange={setSearchKeyword} isLoading={searchLoading} />
            </div>

            {/* Select Project */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-white uppercase mb-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Dự Án Trọng Điểm
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 text-sm text-white border border-white/25 focus:border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 appearance-none transition-all shadow-inner cursor-pointer backdrop-blur-[1px]"
                >
                  <option value="all" className="bg-slate-900 text-white">Tất cả dự án</option>
                  {projectsList.map((p) => (
                    <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Select City / Region */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-white uppercase mb-1 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Khu Vực / Tỉnh Thành
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 text-sm text-white border border-white/25 focus:border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 appearance-none transition-all shadow-inner cursor-pointer backdrop-blur-[1px]"
                >
                  <option value="all" className="bg-slate-900 text-white">Toàn quốc</option>
                  {citiesList.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Search Submit Action */}
            <div className="lg:col-span-2">
              <button
                onClick={() => {
                  const element = document.getElementById('listing-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/40 transition-all cursor-pointer"
              >
                {searchLoading ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Search aria-hidden="true" className="w-4 h-4" />}
                <span>{searchLoading ? 'Đang tìm...' : `Tìm Kiếm (${totalResults})`}</span>
              </button>
            </div>

          </div>

          {searchError && <div role="alert" className="mt-3 rounded-lg border border-red-300/30 bg-red-950/60 px-3 py-2 text-xs text-red-100">{searchError}<button type="button" onClick={onRetrySearch} className="ml-2 font-semibold underline">Thử lại</button></div>}

          {/* Quick Trending Searches */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="font-semibold text-white flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <Tag className="w-3.5 h-3.5 text-white/80" /> Tìm kiếm phổ biến:
            </span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchKeyword(tag)}
                className="px-2.5 py-1 rounded-md bg-black/25 hover:bg-black/45 text-slate-100 hover:text-white border border-white/20 font-medium transition-all text-[11px]"
              >
                {tag}
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
```

### scripts/setup-meilisearch-env.mjs

```javascript
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../.env', import.meta.url));
const backendEnv = fileURLToPath(new URL('../backend/.env', import.meta.url));
const source = existsSync(rootEnv) ? readFileSync(rootEnv, 'utf8') : '';
const existing = source.match(/^MEILI_MASTER_KEY=(.+)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
const key = existing || randomBytes(32).toString('hex');
if (key.length < 16) throw new Error('MEILI_MASTER_KEY must be at least 16 characters; update the root .env.');

function update(path, initial, entries) {
  let text = initial;
  for (const [name, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${name}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, `${name}=${value}`) : `${text.trimEnd()}\n${name}=${value}\n`;
  }
  writeFileSync(path, text, 'utf8');
}

update(rootEnv, source, { MEILI_MASTER_KEY: key });
const backendSource = existsSync(backendEnv) ? readFileSync(backendEnv, 'utf8') : readFileSync(new URL('../backend/.env.example', import.meta.url), 'utf8');
update(backendEnv, backendSource, {
  SCOUT_DRIVER: 'meilisearch', SCOUT_QUEUE: 'false', SCOUT_PREFIX: '3tvland_',
  MEILISEARCH_HOST: 'http://127.0.0.1:7700', MEILISEARCH_KEY: key,
});
console.log('Configured root .env and backend/.env. The secret was not printed. Existing database settings were preserved.');
```

### backend/scripts/check-meilisearch.php

```php
<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = $app->make(\Meilisearch\Client::class);
$indexName = (new \App\Models\Property)->searchableAs();
$index = $client->index($indexName);
$tasks = $index->getTasks((new \Meilisearch\Contracts\TasksQuery)->setLimit(5))->getResults();
echo json_encode([
    'driver' => config('scout.driver'),
    'database' => \Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
    'health' => $client->health(),
    'index' => $indexName,
    'stats' => $index->stats(),
    'recent_tasks' => array_map(fn (array $task) => [
        'uid' => $task['uid'], 'type' => $task['type'], 'status' => $task['status'],
        'error_code' => $task['error']['code'] ?? null,
    ], $tasks),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
```
