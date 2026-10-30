<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractDocument extends Model
{
    use HasFactory, SoftDeletes;

    // Hằng số loại tài liệu (Spec mục 3.2)
    public const TYPE_MAIN = 0;          // Hợp đồng chính
    public const TYPE_APPENDIX = 1;      // Phụ lục hợp đồng
    public const TYPE_ID_CARD = 2;       // Giấy tờ tùy thân (CCCD/Hộ chiếu)
    public const TYPE_PROPERTY_DOC = 3;  // Giấy tờ bất động sản (Sổ đỏ/hợp đồng mua bán)
    public const TYPE_HANDOVER = 4;      // Biên bản bàn giao/thanh lý
    public const TYPE_OTHER = 5;         // Khác
    public const TYPE_DEPOSIT_RECEIPT = 6; // Biên lai / Chứng từ tiền cọc

    // Danh sách loại tài liệu khách hàng được phép xem/tải (Spec mục 3.4)
    public const CUSTOMER_ALLOWED_TYPES = [
        self::TYPE_MAIN,
        self::TYPE_APPENDIX,
        self::TYPE_HANDOVER,
        self::TYPE_DEPOSIT_RECEIPT,
    ];

    // Quy tắc upload tài liệu (Spec mục 3.3)
    public const MAX_FILE_SIZE = 10485760; // 10MB
    public const MAX_FILES_PER_CONTRACT = 20;
    public const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    public const ALLOWED_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
    ];

    protected $fillable = [
        'contract_id',
        'extension_id',
        'document_type',
        'title',
        'file_url',
        'original_name',
        'file_size',
        'mime_type',
        'description',
        'uploaded_by',
    ];

    protected $casts = [
        'document_type' => 'integer',
        'file_size' => 'integer',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'document_type_label',
        'file_size_formatted',
    ];

    /**
     * Nhãn tiếng Việt của loại tài liệu
     */
    public function getDocumentTypeLabelAttribute(): string
    {
        return match ((int)$this->document_type) {
            self::TYPE_MAIN => 'Hợp đồng chính',
            self::TYPE_APPENDIX => 'Phụ lục hợp đồng',
            self::TYPE_ID_CARD => 'Giấy tờ tùy thân',
            self::TYPE_PROPERTY_DOC => 'Giấy tờ bất động sản',
            self::TYPE_HANDOVER => 'Biên bản bàn giao/thanh lý',
            self::TYPE_DEPOSIT_RECEIPT => 'Chứng từ tiền cọc',
            default => 'Tài liệu khác',
        };
    }

    /**
     * Định dạng kích thước file dễ đọc (KB/MB)
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = (int)$this->file_size;
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function extension()
    {
        return $this->belongsTo(ContractExtension::class, 'extension_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
