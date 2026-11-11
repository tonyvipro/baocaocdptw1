<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customer_demands')) {
            // 1. Thêm các trường có cấu trúc để ghép tự động (tất cả đều nullable để tương thích dữ liệu cũ)
            Schema::table('customer_demands', function (Blueprint $table) {
                if (!Schema::hasColumn('customer_demands', 'category_id')) {
                    $table->unsignedBigInteger('category_id')->nullable()->after('property_type_id');
                }
                if (!Schema::hasColumn('customer_demands', 'province_id')) {
                    $table->unsignedInteger('province_id')->nullable()->after('category_id');
                }
                if (!Schema::hasColumn('customer_demands', 'district_id')) {
                    $table->unsignedInteger('district_id')->nullable()->after('province_id');
                }
                if (!Schema::hasColumn('customer_demands', 'ward_id')) {
                    $table->unsignedInteger('ward_id')->nullable()->after('district_id');
                }
                if (!Schema::hasColumn('customer_demands', 'location_ids')) {
                    $table->json('location_ids')->nullable()->after('ward_id');
                }
                if (!Schema::hasColumn('customer_demands', 'bedrooms')) {
                    $table->unsignedSmallInteger('bedrooms')->nullable()->after('location_ids');
                }
                if (!Schema::hasColumn('customer_demands', 'bathrooms')) {
                    $table->unsignedSmallInteger('bathrooms')->nullable()->after('bedrooms');
                }
            });

            // 2. Chuyển kiểu ngân sách thành unsignedBigInteger và area, property_type_id thành nullable
            try {
                Schema::table('customer_demands', function (Blueprint $table) {
                    $table->unsignedBigInteger('budget_min')->change();
                    $table->unsignedBigInteger('budget_max')->change();
                    $table->string('area', 250)->nullable()->change();
                    $table->unsignedInteger('property_type_id')->nullable()->change();
                });
            } catch (\Throwable $e) {
                // SQLite fallback
            }

            // 3. Thêm khóa ngoại và index an toàn cho cả MySQL và SQLite
            try {
                Schema::table('customer_demands', function (Blueprint $table) {
                    if (Schema::hasTable('categories')) {
                        $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
                    }
                    if (Schema::hasTable('provinces')) {
                        $table->foreign('province_id')->references('id')->on('provinces')->nullOnDelete();
                    }
                    if (Schema::hasTable('districts')) {
                        $table->foreign('district_id')->references('id')->on('districts')->nullOnDelete();
                    }
                    if (Schema::hasTable('wards')) {
                        $table->foreign('ward_id')->references('id')->on('wards')->nullOnDelete();
                    }
                    $table->index(['category_id', 'status']);
                    $table->index(['province_id', 'district_id']);
                });
            } catch (\Throwable $e) {
                // SQLite in-memory fallback
            }

            // 4. Khớp dữ liệu cũ: Khớp category_id từ property_types nếu có
            if (Schema::hasTable('categories') && Schema::hasTable('property_types')) {
                $categories = DB::table('categories')->whereNull('deleted_at')->get();
                $types = DB::table('property_types')->get()->keyBy('id');

                $demands = DB::table('customer_demands')->whereNull('category_id')->whereNotNull('property_type_id')->get();
                foreach ($demands as $d) {
                    $type = $types->get($d->property_type_id);
                    if ($type) {
                        $matchingCat = $categories->first(function ($cat) use ($type) {
                            return mb_strtolower($cat->name) === mb_strtolower($type->name)
                                || mb_stripos($type->name, $cat->name) !== false
                                || mb_stripos($cat->name, $type->name) !== false;
                        });
                        if ($matchingCat) {
                            DB::table('customer_demands')->where('id', $d->id)->update([
                                'category_id' => $matchingCat->id,
                            ]);
                        }
                    }
                }
            }

            // 5. Khớp dữ liệu cũ: Khớp province_id / district_id từ chuỗi area nếu có
            if (Schema::hasTable('districts') && Schema::hasTable('provinces')) {
                $districts = DB::table('districts')->get();
                $provinces = DB::table('provinces')->get();

                $demandsWithoutDistrict = DB::table('customer_demands')->whereNull('district_id')->whereNotNull('area')->get();
                foreach ($demandsWithoutDistrict as $d) {
                    $areaStr = mb_strtolower((string) $d->area);
                    $matchedDistrict = $districts->first(function ($dist) use ($areaStr) {
                        return mb_stripos($areaStr, mb_strtolower($dist->name)) !== false;
                    });
                    if ($matchedDistrict) {
                        DB::table('customer_demands')->where('id', $d->id)->update([
                            'district_id' => $matchedDistrict->id,
                            'province_id' => $matchedDistrict->province_id,
                        ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('customer_demands')) {
            Schema::table('customer_demands', function (Blueprint $table) {
                $table->dropColumn([
                    'category_id',
                    'province_id',
                    'district_id',
                    'ward_id',
                    'location_ids',
                    'bedrooms',
                    'bathrooms',
                ]);
            });
        }
    }
};

