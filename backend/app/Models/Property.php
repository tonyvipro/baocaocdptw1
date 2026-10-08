<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function images()
    {
        return $this->hasMany(PropertyImage::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Đánh dấu BĐS đã bán/cho thuê thành công (Tự động chuyển status = 0 hoặc tương ứng)
     */
    public function markAsSoldOrRented()
    {
        $this->status = 0; // Giả sử 0 là trạng thái ngừng giao dịch/Đã bán. Tùy thuộc vào design ban đầu.
        $this->save();
    }
}
