<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Bảng brokers (Chuẩn Hình 29 - Quản lý môi giới)
        Schema::create('brokers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('code', 50)->unique(); // Mã ID (e.g. MG-001)
            $table->string('name', 250); // Tên Môi giới
            $table->string('phone', 50)->nullable();
            $table->string('email', 250)->nullable();
            $table->string('level', 100)->default('Chuyên viên'); // Cấp bậc
            $table->integer('deals_count')->default(0); // Số giao dịch
            $table->decimal('total_commission', 15, 2)->default(0); // Tổng hoa hồng
            $table->string('status', 50)->default('active'); // active, inactive, busy
            $table->string('avatar', 250)->nullable();
            $table->string('notes', 250)->nullable(); // Ghi chú tối đa 250 ký tự
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['name', 'code']);
            $table->index('status');
        });

        // 2. Bảng broker_assignments (Chuẩn Hình 30 - Phân công môi giới)
        Schema::create('broker_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 50); // ID Yêu cầu (e.g. YC-2026-001)
            $table->string('customer_name', 250); // Tên khách hàng
            $table->string('customer_phone', 50)->nullable();
            $table->string('customer_email', 250)->nullable();
            $table->string('property_location', 250); // Địa điểm BĐS
            $table->unsignedBigInteger('broker_id'); // Môi giới được phân công
            $table->date('assigned_date'); // Ngày yêu cầu / phân công
            $table->string('status', 50)->default('pending'); // pending, processing, completed, cancelled
            $table->string('notes', 250)->nullable(); // Yêu cầu / Ghi chú (tối đa 250 ký tự)
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('broker_id')->references('id')->on('brokers')->onDelete('cascade');
            $table->index(['request_code', 'customer_name']);
            $table->index('status');
            $table->index('assigned_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broker_assignments');
        Schema::dropIfExists('brokers');
    }
};
