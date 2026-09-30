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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->string('developer')->nullable(); // Vinhomes, Novaland, Sun Group, Khang Điền, Nam Long, Hưng Thịnh, Him Lam, FLC, BIM Group, Kim Oanh
            $table->string('project')->nullable();
            $table->enum('purpose', ['sale', 'rent', 'project'])->default('sale'); // Mua bán / Cho thuê / Dự án
            $table->string('type')->default('Căn hộ cao cấp'); // Loại hình BĐS
            
            // Tài chính & Giá
            $table->decimal('price_sale', 15, 2)->nullable(); // Giá bán (VNĐ)
            $table->string('price_sale_text')->nullable(); // VD: "4.2 tỷ"
            $table->decimal('price_rent', 15, 2)->nullable(); // Giá thuê hàng tháng (VNĐ)
            $table->string('price_rent_text')->nullable(); // VD: "16 triệu/tháng"
            $table->decimal('deposit', 15, 2)->nullable(); // Tiền cọc (VNĐ)
            $table->string('deposit_text')->nullable(); // VD: "32 triệu (2 tháng)"
            $table->string('unit_price')->nullable(); // VD: "58 triệu/m²"
            
            // Pháp lý & Hợp đồng
            $table->string('legal')->nullable(); // Sổ hồng, HĐMB
            $table->string('rent_period_min')->nullable(); // Thời hạn thuê tối thiểu: 1 năm, 6 tháng
            $table->string('furniture')->nullable(); // Tình trạng nội thất
            $table->string('management_fee')->nullable(); // Phí quản lý hàng tháng
            $table->string('available_date')->nullable(); // Ngày có thể dọn vào
            
            // Thông số BĐS
            $table->float('area')->default(0); // Diện tích (m²)
            $table->unsignedSmallInteger('bedrooms')->default(0); // Số phòng ngủ
            $table->unsignedSmallInteger('bathrooms')->default(0); // Số phòng tắm / vệ sinh
            
            // Vị trí & Tọa độ bản đồ
            $table->string('street')->nullable(); // Tên đường
            $table->string('district')->nullable(); // Quận / Huyện
            $table->string('city')->default('TP. Hồ Chí Minh'); // Tỉnh / Thành phố
            $table->decimal('lat', 10, 7)->nullable(); // Tọa độ vĩ độ
            $table->decimal('lng', 10, 7)->nullable(); // Tọa độ kinh độ
            
            // Hình ảnh & Trạng thái
            $table->text('image')->nullable();
            $table->string('badge')->nullable(); // "Cho thuê gấp", "Đang mở bán"
            $table->string('badge_class')->nullable();
            $table->string('owner_name')->nullable(); // Tên chủ nhà / người liên hệ
            $table->string('owner_phone')->nullable();
            $table->enum('status', ['available', 'rented', 'sold', 'pending'])->default('available');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
