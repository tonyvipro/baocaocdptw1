<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_types', function (Blueprint $table) {
            if (!Schema::hasColumn('property_types', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('property_types', 'parent_id')) {
                $table->unsignedInteger('parent_id')->nullable()->after('description');
                $table->foreign('parent_id')->references('id')->on('property_types')->nullOnDelete();
            }
            if (!Schema::hasColumn('property_types', 'status')) {
                $table->tinyInteger('status')->default(1)->after('parent_id'); // 1: Active, 0: Inactive
            }
        });
    }

    public function down(): void
    {
        Schema::table('property_types', function (Blueprint $table) {
            if (Schema::hasColumn('property_types', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropColumn('parent_id');
            }
            if (Schema::hasColumn('property_types', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('property_types', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
