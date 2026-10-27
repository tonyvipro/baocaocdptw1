<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Laravel\Scout\Searchable;

class Property extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['status' => 'integer', 'bedrooms' => 'integer', 'bathrooms' => 'integer', 'floors' => 'integer', 'area' => 'float'];
    }

    public function searchableAs(): string
    {
        return config('scout.prefix').'properties';
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => (int) $this->getKey(),
            'code' => (string) $this->code,
            'title' => (string) $this->title,
            'project' => (string) $this->project,
            'address' => (string) $this->address,
            'street' => (string) $this->street,
            'district' => (string) $this->district,
            'city' => (string) $this->city,
            'developer' => (string) $this->developer,
            'type' => (string) $this->type,
            'purpose' => (string) $this->purpose,
            'price' => (float) ($this->price ?? ($this->purpose === 'rent' ? $this->price_rent : $this->price_sale)),
            'area' => (float) $this->area,
            'bedrooms' => (int) $this->bedrooms,
            'status' => (int) $this->status,
            'expires_at' => $this->expire_date ? Carbon::parse($this->expire_date)->timestamp : 0,
            'created_at' => $this->created_at?->timestamp ?? 0,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return !$this->trashed() && $this->status === 1
            && (!$this->expire_date || Carbon::parse($this->expire_date)->greaterThanOrEqualTo(now()));
    }

    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->withoutTrashed()->where('status', 1)
            ->where(fn (Builder $q) => $q->whereNull('expire_date')->orWhere('expire_date', '>=', now()));
    }

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
     * Đánh dấu BĐS đã bán/cho thuê thành công (Chuyển sang trạng thái 2: Đã giao dịch)
     */
    public function markAsSoldOrRented()
    {
        $this->status = 2; // 2 = Đã giao dịch (Bán/Thuê)
        $this->save();
    }
}
