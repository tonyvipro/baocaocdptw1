<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\CustomerDemand;
use App\Models\CustomerInteraction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerDuplicateService
{
    /**
     * Chuẩn hóa số điện thoại: bỏ khoảng trắng, dấu chấm, gạch ngang, chuyển +84/84 đầu sang 0
     */
    public static function normalizePhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        // Bỏ khoảng trắng, dấu ngoặc, chấm, gạch ngang
        $cleaned = preg_replace('/[\s\.\-\(\)]+/', '', trim($phone));
        if ($cleaned === '') {
            return null;
        }

        // Chuyển +84 ở đầu thành 0
        if (str_starts_with($cleaned, '+84')) {
            $cleaned = '0' . substr($cleaned, 3);
        }
        // Chuyển 84 ở đầu (nếu theo sau là 9 hoặc 10 chữ số) thành 0
        elseif (preg_match('/^84([1-9]\d{8,9})$/', $cleaned, $matches)) {
            $cleaned = '0' . $matches[1];
        }

        return $cleaned !== '' ? $cleaned : null;
    }

    /**
     * Chuẩn hóa email: viết thường toàn bộ và cắt khoảng trắng
     */
    public static function normalizeEmail(?string $email): ?string
    {
        if ($email === null) {
            return null;
        }

        $cleaned = strtolower(trim($email));
        return $cleaned !== '' ? $cleaned : null;
    }

    /**
     * Chuẩn hóa họ tên: viết thường, bỏ dấu tiếng Việt, gom khoảng trắng
     */
    public static function normalizeName(?string $name): string
    {
        if ($name === null) {
            return '';
        }

        $cleaned = trim($name);
        $cleaned = preg_replace('/\s+/', ' ', $cleaned);
        $withoutAccents = self::removeVietnameseAccents($cleaned);

        return strtolower($withoutAccents);
    }

    /**
     * Bỏ dấu tiếng Việt phục vụ so sánh tương đồng họ tên
     */
    public static function removeVietnameseAccents(string $str): string
    {
        $accents = [
            'a' => '/[àáạảãâầấậẩẫăằắặẳẵ]/u',
            'A' => '/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/u',
            'd' => '/[đ]/u',
            'D' => '/[Đ]/u',
            'e' => '/[èéẹẻẽêềếệểễ]/u',
            'E' => '/[ÈÉẸẺẼÊỀẾỆỂỄ]/u',
            'i' => '/[ìíịỉĩ]/u',
            'I' => '/[ÌÍỊỈĨ]/u',
            'o' => '/[òóọỏõôồốộổỗơờớợởỡ]/u',
            'O' => '/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/u',
            'u' => '/[ùúụủũưừứựửữ]/u',
            'U' => '/[ÙÚỤỦŨƯỪỨỰỬỮ]/u',
            'y' => '/[ỳýỵỷỹ]/u',
            'Y' => '/[ỲÝỴỶỸ]/u',
        ];

        foreach ($accents as $nonAccent => $pattern) {
            $str = preg_replace($pattern, $nonAccent, $str);
        }

        return $str;
    }

    /**
     * Kiểm tra và tìm danh sách các khách hàng nghi ngờ trùng lặp
     */
    public function checkDuplicates(array $attributes, ?int $excludeId = null): array
    {
        $rawPhone = $attributes['phone'] ?? null;
        $rawEmail = $attributes['email'] ?? null;
        $rawName = $attributes['name'] ?? null;

        $normPhone = self::normalizePhone($rawPhone);
        $normEmail = self::normalizeEmail($rawEmail);
        $normName = self::normalizeName($rawName);

        if (!$normPhone && !$normEmail && $normName === '') {
            return [
                'has_duplicates' => false,
                'count' => 0,
                'duplicates' => [],
            ];
        }

        // Truy vấn tất cả khách hàng đang active (chưa soft-delete)
        $query = Customer::query()->whereNull('deleted_at');
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        // Lọc các bản ghi ứng viên có khả năng trùng để giảm tải bộ nhớ
        $query->where(function ($q) use ($normPhone, $normEmail, $rawName) {
            $hasCondition = false;
            if ($normPhone) {
                // Khớp số điện thoại (chứa phần đuôi hoặc khớp trực tiếp)
                $phoneSuffix = strlen($normPhone) >= 7 ? substr($normPhone, -7) : $normPhone;
                $q->orWhere('phone', 'LIKE', "%{$phoneSuffix}%");
                $hasCondition = true;
            }
            if ($normEmail) {
                $q->orWhere('email', 'LIKE', $normEmail);
                $hasCondition = true;
            }
            if (!empty($rawName) && mb_strlen(trim($rawName)) >= 2) {
                $trimmedName = trim($rawName);
                $q->orWhere('name', 'LIKE', '%' . $trimmedName . '%');

                $normWords = preg_split('/\s+/', self::normalizeName($trimmedName));
                $rawWords = preg_split('/\s+/', $trimmedName);
                $allWords = array_unique(array_filter(array_merge($rawWords, $normWords), fn ($w) => mb_strlen($w) >= 2));
                foreach ($allWords as $word) {
                    $q->orWhere('name', 'LIKE', '%' . $word . '%');
                }
                $hasCondition = true;
            }

            if (!$hasCondition) {
                $q->whereRaw('1 = 0');
            }
        });

        $candidates = $query->with(['assignedTo:id,name'])
            ->withCount(['demands', 'activities', 'interactions'])
            ->limit(50)
            ->get();

        // Dự phòng cho SQLite khi tìm kiếm tiếng Việt không dấu (accent-insensitive)
        if ($candidates->isEmpty() && $normName !== '') {
            $candidates = Customer::query()->whereNull('deleted_at')
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->orderByDesc('id')
                ->limit(100)
                ->with(['assignedTo:id,name'])
                ->withCount(['demands', 'activities', 'interactions'])
                ->get();
        }

        $duplicates = [];

        foreach ($candidates as $cand) {
            $candPhone = self::normalizePhone($cand->phone);
            $candEmail = self::normalizeEmail($cand->email);
            $candNameNorm = self::normalizeName($cand->name);

            $matchedReasons = [];
            $matchLabels = [];
            $score = 0;

            // 1. So khớp Số điện thoại
            if ($normPhone && $candPhone && $normPhone === $candPhone) {
                $matchedReasons[] = 'phone';
                $matchLabels[] = 'Trùng số điện thoại (' . $cand->phone . ')';
                $score += 60;
            }

            // 2. So khớp Email
            if ($normEmail && $candEmail && $normEmail === $candEmail) {
                $matchedReasons[] = 'email';
                $matchLabels[] = 'Trùng email (' . $cand->email . ')';
                $score += 50;
            }

            // 3. So khớp Họ tên
            if ($normName !== '' && $candNameNorm !== '') {
                if ($normName === $candNameNorm) {
                    $matchedReasons[] = 'exact_name';
                    $matchLabels[] = 'Trùng họ tên chính xác';
                    $score += 35;
                } else {
                    // Kiểm tra độ tương đồng percentage
                    similar_text($normName, $candNameNorm, $percent);
                    if ($percent >= 80) {
                        $matchedReasons[] = 'similar_name';
                        $matchLabels[] = 'Họ tên gần giống (' . round($percent) . '%)';
                        $score += 25;
                    } elseif (str_contains($normName, $candNameNorm) || str_contains($candNameNorm, $normName)) {
                        $matchedReasons[] = 'contained_name';
                        $matchLabels[] = 'Họ tên chứa nhau';
                        $score += 20;
                    }
                }
            }

            // Tiêu chuẩn nghi trùng: có ít nhất 1 lý do trùng hợp lệ
            if (!empty($matchedReasons)) {
                $duplicates[] = [
                    'id' => $cand->id,
                    'code' => $cand->code,
                    'name' => $cand->name,
                    'phone' => $cand->phone,
                    'email' => $cand->email,
                    'company' => $cand->company,
                    'customer_group' => $cand->customer_group,
                    'customer_group_label' => Customer::GROUPS[$cand->customer_group] ?? $cand->customer_group,
                    'status' => $cand->status,
                    'status_label' => Customer::STATUSES[$cand->status] ?? $cand->status,
                    'assigned_to' => $cand->assignedTo ? [
                        'id' => $cand->assignedTo->id,
                        'name' => $cand->assignedTo->name,
                    ] : null,
                    'demands_count' => (int) $cand->demands_count,
                    'activities_count' => (int) $cand->activities_count,
                    'interactions_count' => (int) $cand->interactions_count,
                    'matched_reasons' => $matchedReasons,
                    'match_labels' => $matchLabels,
                    'confidence_score' => min(100, $score),
                ];
            }
        }

        // Sắp xếp các bản ghi có độ tin cậy trùng lặp cao nhất lên đầu
        usort($duplicates, fn ($a, $b) => $b['confidence_score'] <=> $a['confidence_score']);

        return [
            'has_duplicates' => count($duplicates) > 0,
            'count' => count($duplicates),
            'duplicates' => $duplicates,
        ];
    }

    /**
     * Gộp hồ sơ khách hàng phụ vào hồ sơ khách hàng chính trong DB::transaction
     */
    public function merge(int $primaryId, int $secondaryId, ?string $reason = null, ?User $actor = null): array
    {
        if ($primaryId === $secondaryId) {
            abort(422, 'Không thể gộp một hồ sơ khách hàng vào chính nó.');
        }

        return DB::transaction(function () use ($primaryId, $secondaryId, $reason, $actor) {
            // Khóa bi quan cả 2 hồ sơ
            $primary = Customer::lockForUpdate()->find($primaryId);
            $secondary = Customer::lockForUpdate()->find($secondaryId);

            if (!$primary || $primary->trashed()) {
                abort(404, 'Hồ sơ khách hàng chính không tồn tại hoặc đã bị xóa.');
            }

            if (!$secondary || $secondary->trashed()) {
                abort(404, 'Hồ sơ khách hàng phụ không tồn tại hoặc đã bị xóa/gộp trước đó.');
            }

            // Lưu snapshot toàn bộ hồ sơ phụ trước khi gộp
            $secondarySnapshot = $secondary->toArray();

            // 1. Chuyển Nhu cầu (customer_demands) sang hồ sơ chính
            $demandsCount = CustomerDemand::where('customer_id', $secondary->id)
                ->update(['customer_id' => $primary->id]);

            // 2. Chuyển Lịch chăm sóc (customer_activities) sang hồ sơ chính
            $activitiesCount = CustomerActivity::where('customer_id', $secondary->id)
                ->update(['customer_id' => $primary->id]);

            // 3. Chuyển Nhật ký tương tác (customer_interactions) sang hồ sơ chính
            $interactionsCount = CustomerInteraction::where('customer_id', $secondary->id)
                ->update(['customer_id' => $primary->id]);

            // 4. Chuyển Phân công môi giới (broker_assignments) nếu có bảng
            if (Schema::hasTable('broker_assignments') && Schema::hasColumn('broker_assignments', 'customer_id')) {
                DB::table('broker_assignments')
                    ->where('customer_id', $secondary->id)
                    ->update(['customer_id' => $primary->id]);
            }

            // 5. Bổ sung thông tin còn thiếu cho hồ sơ chính từ hồ sơ phụ
            if (empty($primary->email) && !empty($secondary->email)) {
                $primary->email = $secondary->email;
            }
            if (empty($primary->phone) && !empty($secondary->phone)) {
                $primary->phone = $secondary->phone;
            }
            if (empty($primary->company) && !empty($secondary->company)) {
                $primary->company = $secondary->company;
            }
            if (empty($primary->source) && !empty($secondary->source)) {
                $primary->source = $secondary->source;
            }

            // Ghi chú việc gộp vào hồ sơ chính
            $nowStr = Carbon::now('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');
            $actorName = $actor?->name ?? 'Hệ thống';
            $mergeNote = "[Đã gộp từ KH #{$secondary->code} ({$secondary->name}) lúc {$nowStr} bởi {$actorName}"
                . ($reason ? ": {$reason}" : "") . "]";

            $combinedNotes = trim(($primary->notes ? $primary->notes . "\n" : '') . $mergeNote . ($secondary->notes ? "\n" . $secondary->notes : ''));
            $primary->notes = mb_substr($combinedNotes, 0, 250);
            $primary->version = ($primary->version ?? 1) + 1;
            $primary->save();

            // 6. Ghi lịch sử gộp vào bảng customer_merge_histories
            if (Schema::hasTable('customer_merge_histories')) {
                DB::table('customer_merge_histories')->insert([
                    'primary_customer_id' => $primary->id,
                    'secondary_customer_id' => $secondary->id,
                    'performed_by' => $actor?->id,
                    'reason' => $reason,
                    'transferred_demands' => $demandsCount,
                    'transferred_activities' => $activitiesCount,
                    'transferred_interactions' => $interactionsCount,
                    'secondary_snapshot' => json_encode($secondarySnapshot, JSON_UNESCAPED_UNICODE),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 7. Ghi nhận ActivityLog (Lưu lâu dài kèm snapshot)
            ActivityLog::create(array_merge([
                'user_id' => $actor?->id,
                'action' => 'CUSTOMER_MERGE',
                'table_name' => 'customers',
                'record_id' => $primary->id,
                'new_data' => [
                    'description' => "Đã gộp hồ sơ KH #{$secondary->code} ({$secondary->name}) vào KH #{$primary->code} ({$primary->name}). Đã chuyển {$demandsCount} nhu cầu, {$activitiesCount} lịch chăm sóc, {$interactionsCount} tương tác.",
                    'primary_id' => $primary->id,
                    'secondary_id' => $secondary->id,
                    'transferred' => [
                        'demands' => $demandsCount,
                        'activities' => $activitiesCount,
                        'interactions' => $interactionsCount,
                    ],
                    'reason' => $reason,
                ],
                'subject_snapshot' => [
                    'primary' => ['id' => $primary->id, 'name' => $primary->name, 'code' => $primary->code],
                    'secondary' => ['id' => $secondary->id, 'name' => $secondary->name, 'code' => $secondary->code],
                ],
                'ip_address' => request()?->ip(),
            ], ActivityLog::extractActorSnapshot($actor)));

            // 8. Đánh dấu và Soft delete hồ sơ phụ (KHÔNG xóa vật lý, không mất dữ liệu)
            if (Schema::hasColumn('customers', 'merged_into_id')) {
                $secondary->merged_into_id = $primary->id;
            }
            $secondary->notes = mb_substr("[ĐÃ GỘP VÀO KH #{$primary->code} lúc {$nowStr}]: " . ($secondary->notes ?? ''), 0, 250);
            $secondary->save();
            $secondary->delete(); // Soft delete

            return [
                'status' => 'success',
                'message' => "Đã gộp thành công hồ sơ khách hàng {$secondary->name} vào {$primary->name}.",
                'primary' => $primary->fresh(['assignedTo', 'interactions', 'activities']),
                'secondary_id' => $secondary->id,
                'transferred' => [
                    'demands' => $demandsCount,
                    'activities' => $activitiesCount,
                    'interactions' => $interactionsCount,
                ],
            ];
        });
    }
}
