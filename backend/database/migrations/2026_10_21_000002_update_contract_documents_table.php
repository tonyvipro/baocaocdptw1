<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('contract_documents', 'extension_id')) {
                $table->unsignedBigInteger('extension_id')->nullable()->after('contract_id');
                $table->foreign('extension_id')->references('id')->on('contract_extensions')->onDelete('cascade');
                $table->index('extension_id', 'idx_cd_extension_id');
            }

            if (!Schema::hasColumn('contract_documents', 'original_name')) {
                $table->string('original_name', 255)->nullable()->after('file_url');
            }

            if (!Schema::hasColumn('contract_documents', 'file_size')) {
                $table->integer('file_size')->nullable()->after('original_name')
                    ->comment('Kích thước file tính bằng bytes');
            }

            if (!Schema::hasColumn('contract_documents', 'mime_type')) {
                $table->string('mime_type', 100)->nullable()->after('file_size');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contract_documents', function (Blueprint $table) {
            $table->dropForeign(['extension_id']);
            $table->dropIndex('idx_cd_extension_id');
            $table->dropColumn([
                'extension_id',
                'original_name',
                'file_size',
                'mime_type',
            ]);
        });
    }
};
