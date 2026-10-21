<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('contract_documents', 'document_type')) {
                // 0: Hợp đồng chính, 1: Phụ lục, 2: Giấy tờ tùy thân, 3: Giấy tờ BĐS, 4: Biên bản bàn giao/thanh lý, 5: Khác
                $table->tinyInteger('document_type')->default(5)->after('extension_id');
            }
            if (!Schema::hasColumn('contract_documents', 'title')) {
                $table->string('title', 255)->nullable()->after('document_type');
            }
            if (!Schema::hasColumn('contract_documents', 'description')) {
                $table->text('description')->nullable()->after('mime_type');
            }
            if (!Schema::hasColumn('contract_documents', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->after('description')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('contract_documents', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Thêm index tối ưu truy vấn cho contract_documents
        Schema::table('contract_documents', function (Blueprint $table) {
            $table->index(['contract_id', 'document_type']);
            $table->index(['contract_id', 'deleted_at']);
        });

        // Index cho contracts (customer_id, status) phục vụ nhanh "Hợp đồng của tôi"
        if (Schema::hasTable('contracts') && Schema::hasColumn('contracts', 'customer_id') && Schema::hasColumn('contracts', 'status')) {
            Schema::table('contracts', function (Blueprint $table) {
                $table->index(['customer_id', 'status']);
            });
        }

        // Backfill dữ liệu cũ an toàn
        DB::table('contract_documents')->get()->each(function ($doc) {
            $updates = [];
            if (empty($doc->title) && !empty($doc->original_name)) {
                $updates['title'] = $doc->original_name;
            } elseif (empty($doc->title) && !empty($doc->file_url)) {
                $updates['title'] = basename($doc->file_url);
            }

            if (empty($doc->original_name) && !empty($doc->file_url)) {
                $updates['original_name'] = basename($doc->file_url);
            }

            // Nếu gắn với extension_id thì là Phụ lục (type = 1), còn lại mặc định HĐ chính (type = 0) nếu chưa set
            if (!empty($doc->extension_id)) {
                $updates['document_type'] = 1;
            } else {
                $updates['document_type'] = 0;
            }

            if (!empty($updates)) {
                DB::table('contract_documents')->where('id', $doc->id)->update($updates);
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('contracts')) {
            Schema::table('contracts', function (Blueprint $table) {
                $table->dropIndex(['customer_id', 'status']);
            });
        }

        Schema::table('contract_documents', function (Blueprint $table) {
            $table->dropIndex(['contract_id', 'document_type']);
            $table->dropIndex(['contract_id', 'deleted_at']);

            if (Schema::hasColumn('contract_documents', 'uploaded_by')) {
                $table->dropForeign(['uploaded_by']);
                $table->dropColumn('uploaded_by');
            }
            if (Schema::hasColumn('contract_documents', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('contract_documents', 'title')) {
                $table->dropColumn('title');
            }
            if (Schema::hasColumn('contract_documents', 'document_type')) {
                $table->dropColumn('document_type');
            }
            if (Schema::hasColumn('contract_documents', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
