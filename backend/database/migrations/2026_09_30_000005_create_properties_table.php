<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 4.2.1.5 Bảng properties (Spec trang 20, 30)
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->nullable()->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedInteger('property_type_id')->nullable();
            $table->string('title', 255);
            $table->longText('description')->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->float('area')->default(0);
            $table->string('address', 255)->nullable();
            $table->unsignedInteger('province_id')->nullable();
            $table->unsignedInteger('district_id')->nullable();
            $table->unsignedInteger('ward_id')->nullable();
            $table->integer('bedrooms')->nullable()->default(0);
            $table->integer('bathrooms')->nullable()->default(0);
            $table->integer('floors')->nullable()->default(1);
            $table->string('direction', 50)->nullable();
            $table->string('legal_status', 100)->nullable();
            $table->integer('build_year')->nullable();
            $table->text('amenities')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->tinyInteger('status')->default(1);
            $table->dateTime('expire_date')->nullable();
            $table->softDeletes();
            
            $table->string('developer', 255)->nullable();
            $table->string('project', 255)->nullable();
            $table->enum('purpose', ['sale', 'rent', 'project'])->default('sale');
            $table->string('type', 100)->default('Căn hộ cao cấp');
            $table->decimal('price_sale', 15, 2)->nullable();
            $table->string('price_sale_text', 100)->nullable();
            $table->decimal('price_rent', 15, 2)->nullable();
            $table->string('price_rent_text', 100)->nullable();
            $table->decimal('deposit', 15, 2)->nullable();
            $table->string('deposit_text', 100)->nullable();
            $table->string('unit_price', 100)->nullable();
            $table->string('legal', 100)->nullable();
            $table->string('rent_period_min', 100)->nullable();
            $table->string('furniture', 255)->nullable();
            $table->string('management_fee', 100)->nullable();
            $table->string('available_date', 100)->nullable();
            $table->string('street', 255)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('city', 100)->default('TP. Hồ Chí Minh');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->text('image')->nullable();
            $table->string('badge', 100)->nullable();
            $table->string('badge_class', 100)->nullable();
            $table->string('owner_name', 255)->nullable();
            $table->string('owner_phone', 50)->nullable();

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('property_type_id')->references('id')->on('property_types')->nullOnDelete();
            $table->foreign('province_id')->references('id')->on('provinces')->nullOnDelete();
            $table->foreign('district_id')->references('id')->on('districts')->nullOnDelete();
            $table->foreign('ward_id')->references('id')->on('wards')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
