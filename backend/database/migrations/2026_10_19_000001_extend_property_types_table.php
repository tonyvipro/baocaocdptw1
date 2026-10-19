<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('property_types', 'parent_id')) {
            Schema::table('property_types', fn (Blueprint $table) => $table->unsignedInteger('parent_id')->nullable()->index());
        }
        if (!Schema::hasColumn('property_types', 'description')) {
            Schema::table('property_types', fn (Blueprint $table) => $table->text('description')->nullable());
        }
        if (!Schema::hasColumn('property_types', 'status')) {
            Schema::table('property_types', fn (Blueprint $table) => $table->boolean('status')->default(true));
        }
    }

    public function down(): void
    {
        Schema::table('property_types', fn (Blueprint $table) => $table->dropColumn(['parent_id', 'description', 'status']));
    }
};
