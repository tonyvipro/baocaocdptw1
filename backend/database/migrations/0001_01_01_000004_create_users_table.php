<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.1 Bảng Users (Spec trang 18, 28)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('role_id')->nullable();
            $table->string('name', 255);
            $table->string('email', 191)->unique();
            $table->string('password', 255);
            $table->string('phone', 20)->nullable();
            $table->string('avatar', 255)->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->tinyInteger('dark_mode')->default(0);
            $table->softDeletes();
            $table->rememberToken();
            $table->timestamps();

            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
