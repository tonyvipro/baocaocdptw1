<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Thêm cột category_id vào bảng properties
        if (!Schema::hasColumn('properties', 'category_id')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->unsignedBigInteger('category_id')->nullable()->after('property_type_id');
            });
        }

        // 2. Thêm khóa ngoại category_id trỏ tới categories(id) an toàn cho cả MySQL và SQLite
        if (Schema::hasTable('categories')) {
            try {
                Schema::table('properties', function (Blueprint $table) {
                    $table->foreign('category_id')
                        ->references('id')
                        ->on('categories')
                        ->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // Xử lý mềm cho môi trường SQLite in-memory / driver cũ
            }
        }

        // 3. Migration dữ liệu: khớp tên danh mục trong mô tả -> category_id
        if (Schema::hasTable('categories') && Schema::hasTable('properties')) {
            $categories = DB::table('categories')->whereNull('deleted_at')->get();

            if ($categories->isNotEmpty()) {
                $properties = DB::table('properties')->whereNull('deleted_at')->get();
                $unmatched = [];
                $matchedCount = 0;

                foreach ($properties as $property) {
                    $desc = (string) ($property->description ?? '');
                    $matches = [];

                    foreach ($categories as $cat) {
                        // Khớp tên danh mục không phân biệt hoa thường trong mô tả
                        if ($desc !== '' && mb_stripos($desc, $cat->name) !== false) {
                            $matches[] = $cat;
                        }
                    }

                    // Chỉ gán khi khớp duy nhất 1 danh mục, không đoán bừa khi khớp 0 hoặc nhiều hơn 1
                    if (count($matches) === 1) {
                        DB::table('properties')->where('id', $property->id)->update([
                            'category_id' => $matches[0]->id,
                        ]);
                        $matchedCount++;
                    } else {
                        $unmatched[] = [
                            'id' => $property->id,
                            'code' => $property->code,
                            'title' => $property->title,
                            'type' => $property->type,
                            'description_excerpt' => mb_substr($desc, 0, 150),
                            'matched_candidates_count' => count($matches),
                            'matched_candidates' => array_map(fn ($m) => $m->name, $matches),
                            'status' => 'PENDING_MANUAL_REVIEW',
                        ];
                    }
                }

                // Xuất danh sách bản ghi không khớp ra file để duyệt tay
                $exportPath = storage_path('app/unmatched_properties_categories.json');
                try {
                    File::ensureDirectoryExists(dirname($exportPath));
                    File::put($exportPath, json_encode([
                        'generated_at' => now()->toIso8601String(),
                        'total_properties' => $properties->count(),
                        'matched_count' => $matchedCount,
                        'unmatched_count' => count($unmatched),
                        'note' => 'Danh sách bất động sản không khớp chính xác danh mục qua mô tả. Cần duyệt tay, hệ thống không đoán bừa.',
                        'records' => $unmatched,
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                } catch (\Throwable $e) {
                    // Tránh chặn migration nếu lỗi ghi file
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('properties', 'category_id')) {
            Schema::table('properties', function (Blueprint $table) {
                if (DB::getDriverName() !== 'sqlite') {
                    try {
                        $table->dropForeign(['category_id']);
                    } catch (\Throwable $e) {}
                }
                $table->dropColumn('category_id');
            });
        }
    }
};

