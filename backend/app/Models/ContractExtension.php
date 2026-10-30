<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractExtension extends Model
{
    use HasFactory, SoftDeletes;

    // Trạng thái yêu cầu gia hạn (Spec mục 3.5)
    public const STATUS_DRAFT = 0;      // Nháp
    public const STATUS_PENDING = 1;    // Chờ duyệt
    public const STATUS_APPROVED = 2;   // Đã duyệt
    public const STATUS_REJECTED = 3;   // Từ chối
    public const STATUS_CANCELLED = 4;  // Đã hủy

    // Loại gia hạn (Spec mục 3.4)
    public const TYPE_AUTO = 0;         // Gia hạn tự động
    public const TYPE_MANUAL = 1;       // Gia hạn thủ công
    public const TYPE_NEW_TERMS = 2;    // Gia hạn theo điều khoản mới

    // Số tháng gia hạn hợp lệ
    public const ALLOWED_DURATIONS = [3, 6, 12];

    protected $fillable = [
        'contract_id',
        'extension_type',
        'duration_months',
        'new_start_date',
        'new_end_date',
        'new_rental_price',
        'old_end_date',
        'old_rental_price',
        'reason',
        'note',
        'status',
        'extension_date',
        'created_by',
        'approved_by',
        'approved_at',
        'reject_reason',
    ];

    protected $casts = [
        'extension_type' => 'integer',
        'duration_months' => 'integer',
        'status' => 'integer',
        'new_start_date' => 'date:Y-m-d',
        'new_end_date' => 'date:Y-m-d',
        'old_end_date' => 'date:Y-m-d',
        'extension_date' => 'date:Y-m-d',
        'approved_at' => 'datetime',
        'new_rental_price' => 'decimal:2',
        'old_rental_price' => 'decimal:2',
    ];

    /**
     * Map nhãn trạng thái tiếng Việt
     */
    public static function getStatusLabels(): array
    {
        return [
            self::STATUS_DRAFT => 'Nháp',
            self::STATUS_PENDING => 'Chờ duyệt',
            self::STATUS_APPROVED => 'Đã duyệt',
            self::STATUS_REJECTED => 'Từ chối',
            self::STATUS_CANCELLED => 'Đã hủy',
        ];
    }

    /**
     * Map nhãn loại gia hạn tiếng Việt
     */
    public static function getTypeLabels(): array
    {
        return [
            self::TYPE_AUTO => 'Gia hạn tự động',
            self::TYPE_MANUAL => 'Gia hạn thủ công',
            self::TYPE_NEW_TERMS => 'Gia hạn theo điều khoản mới',
        ];
    }

    public function getStatusLabelAttribute(): string
    {
        return self::getStatusLabels()[$this->status] ?? 'Không xác định';
    }

    public function getTypeLabelAttribute(): string
    {
        return self::getTypeLabels()[$this->extension_type] ?? 'Không xác định';
    }

    /**
     * Quan hệ tới Hợp đồng gốc
     */
    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    /**
     * Người tạo yêu cầu (Môi giới hoặc Admin)
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Người phê duyệt (Admin / Quản lý)
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Danh sách tài liệu / phụ lục đính kèm yêu cầu gia hạn này
     */
    public function documents()
    {
        return $this->hasMany(ContractDocument::class, 'extension_id');
    }
}
