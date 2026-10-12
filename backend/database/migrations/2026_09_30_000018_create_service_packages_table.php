<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.21 Bảng service_packages (Spec trang 30, 40)
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->decimal('price', 15, 2)->default(0);
            $table->integer('duration_days')->default(30);
            $table->integer('post_limit')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_packages');
    }
};
