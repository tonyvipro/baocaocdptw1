<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\User;
use App\Notifications\ContractDocumentNotification;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ContractDocumentService
{
    /**
     * Danh sách hợp đồng kèm số lượng tài liệu (dành cho màn hình Quản lý tài liệu Hình 42)
     */
    public function getContractsWithDocumentsCount(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Contract::with(['customer', 'broker', 'property'])
            ->withCount(['documents as documents_count' => function ($q) {
                // Chỉ đếm các tài liệu chưa bị xóa mềm
                $q->whereNull('deleted_at');
            }]);

        // 1. Tìm kiếm (debounce 400ms ở frontend): mã HĐ, tên HĐ, tên khách hàng, tên file
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $search);

            $query->where(function ($q) use ($escaped) {
                $q->where('contract_code', 'LIKE', "%{$escaped}%")
                  ->orWhere('contract_name', 'LIKE', "%{$escaped}%")
                  ->orWhereHas('customer', function ($sub) use ($escaped) {
                      $sub->where('name', 'LIKE', "%{$escaped}%")
                          ->orWhere('phone', 'LIKE', "%{$escaped}%")
                          ->orWhere('email', 'LIKE', "%{$escaped}%");
                  })
                  ->orWhereHas('documents', function ($sub) use ($escaped) {
                      $sub->where('title', 'LIKE', "%{$escaped}%")
                          ->orWhere('original_name', 'LIKE', "%{$escaped}%");
                  });
            });
        }

        // 2. Lọc theo trạng thái hợp đồng (0, 1, 2, 3)
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int)$filters['status']);
        }

        // 3. Lọc theo loại hợp đồng (thông qua property.type)
        if (!empty($filters['contract_type']) && $filters['contract_type'] !== 'all') {
            $query->whereHas('property', function ($q) use ($filters) {
                $q->where('type', $filters['contract_type']);
            });
        }

        // 4. Lọc theo ngày tạo (từ - đến)
        if (!empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }
        if (!empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        return $query->latest('id')->paginate($perPage);
    }

    /**
     * Lấy danh sách tài liệu của một hợp đồng
     */
    public function getDocumentsByContract(int $contractId, ?int $documentType = null): Collection
    {
        $contract = Contract::findOrFail($contractId);

        $query = ContractDocument::with(['uploader', 'extension'])
            ->where('contract_id', $contract->id);

        if ($documentType !== null) {
            $query->where('document_type', $documentType);
        }

        return $query->latest('id')->get();
    }

    /**
     * Lấy chi tiết 1 tài liệu
     */
    public function getDocumentDetail(int $documentId): ContractDocument
    {
        return ContractDocument::with(['contract.property', 'contract.customer', 'contract.broker', 'uploader', 'extension'])
            ->findOrFail($documentId);
    }

    /**
     * Tải lên danh sách tài liệu mới cho hợp đồng (Transaction All-or-Nothing)
     */
    public function uploadDocuments(int $contractId, array $files, array $metadata, User $uploader): array
    {
        $contract = Contract::with('customer')->findOrFail($contractId);

        // Kiểm tra hợp đồng không bị xóa mềm
        if ($contract->trashed()) {
            throw new InvalidArgumentException('Hợp đồng này đã bị xóa, không thể tải lên tài liệu mới.', 422);
        }

        // Kiểm tra số lượng file tối đa (tối đa 20 file/hợp đồng)
        $currentCount = ContractDocument::where('contract_id', $contract->id)->count();
        $newCount = count($files);
        if ($currentCount + $newCount > ContractDocument::MAX_FILES_PER_CONTRACT) {
            throw new InvalidArgumentException(
                "Hợp đồng này hiện có {$currentCount} tài liệu. Tải thêm {$newCount} tài liệu sẽ vượt quá giới hạn cho phép tối đa " . ContractDocument::MAX_FILES_PER_CONTRACT . " tài liệu/hợp đồng.",
                422
            );
        }

        $documentType = isset($metadata['document_type']) ? (int)$metadata['document_type'] : ContractDocument::TYPE_OTHER;
        $titlePrefix = !empty($metadata['title']) ? trim($metadata['title']) : null;
        $description = !empty($metadata['description']) ? trim($metadata['description']) : null;
        $extensionId = !empty($metadata['extension_id']) ? (int)$metadata['extension_id'] : null;

        // Nếu có extension_id thì tự động là Phụ lục (type = 1)
        if ($extensionId) {
            $documentType = ContractDocument::TYPE_APPENDIX;
        }

        $createdDocuments = [];
        $warnings = [];
        $storedFilePaths = [];

        try {
            DB::beginTransaction();

            foreach ($files as $index => $file) {
                $origName = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                $mimeType = $file->getMimeType();
                $extension = strtolower($file->getClientOriginalExtension() ?: 'bin');

                // Cảnh báo (không chặn) khi tải lên file trùng original_name + file_size trong cùng hợp đồng (Spec mục 3.3)
                $duplicateExists = ContractDocument::where('contract_id', $contract->id)
                    ->where('original_name', $origName)
                    ->where('file_size', $fileSize)
                    ->exists();

                if ($duplicateExists) {
                    $warnings[] = "Tệp '{$origName}' ({$fileSize} bytes) có thể đã tồn tại trong hợp đồng này.";
                }

                // Đặt tên ngẫu nhiên UUID chống path traversal, ghi đè và thực thi mã độc
                $uuidFileName = (string)Str::uuid() . '.' . $extension;
                $relativePath = "contracts/{$contract->id}/{$uuidFileName}";

                // Lưu trên disk private 'local'
                $storedPath = Storage::disk('local')->putFileAs("contracts/{$contract->id}", $file, $uuidFileName);
                if (!$storedPath) {
                    throw new \RuntimeException("Không thể lưu trữ tệp '{$origName}' vào hệ thống đĩa an toàn.");
                }
                $storedFilePaths[] = $relativePath;

                // Tên hiển thị title
                $docTitle = $titlePrefix ? ($newCount > 1 ? "{$titlePrefix} ({$index})" : $titlePrefix) : $origName;

                $document = ContractDocument::create([
                    'contract_id' => $contract->id,
                    'extension_id' => $extensionId,
                    'document_type' => $documentType,
                    'title' => $docTitle,
                    'file_url' => $relativePath,
                    'original_name' => $origName,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType,
                    'description' => $description,
                    'uploaded_by' => $uploader->id,
                ]);

                // Ghi activity_logs
                $this->logActivity($uploader->id, 'CONTRACT_DOCUMENT_UPLOAD', $document->id, null, [
                    'contract_id' => $contract->id,
                    'title' => $docTitle,
                    'original_name' => $origName,
                    'file_size' => $fileSize,
                    'mime_type' => $mimeType,
                    'document_type' => $documentType,
                ]);

                // Gửi thông báo cho khách hàng nếu là tài liệu khách được xem ({0, 1, 4}) và HĐ đang hiệu lực (status = 1)
                if (in_array($documentType, ContractDocument::CUSTOMER_ALLOWED_TYPES) && (int)$contract->status === 1 && $contract->customer) {
                    try {
                        $contract->customer->notify(new ContractDocumentNotification(
                            $contract,
                            $document,
                            "Tài liệu mới cho hợp đồng {$contract->contract_code}",
                            "Hợp đồng '{$contract->contract_name}' vừa được bổ sung tài liệu: '{$document->title}'."
                        ));
                    } catch (\Throwable $e) {
                        Log::error("Lỗi gửi thông báo tài liệu mới cho khách hàng: " . $e->getMessage());
                    }
                }

                $createdDocuments[] = $document->fresh(['uploader']);
            }

            DB::commit();

            return [
                'documents' => $createdDocuments,
                'warnings' => $warnings,
                'message' => "Đã tải lên thành công " . count($createdDocuments) . " tài liệu.",
            ];
        } catch (\Throwable $e) {
            DB::rollBack();

            // Dọn dẹp các file vật lý đã upload trong lần này nếu transaction thất bại
            foreach ($storedFilePaths as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $e;
        }
    }

    /**
     * Sửa thông tin hiển thị metadata của tài liệu
     */
    public function updateDocument(int $documentId, array $data, User $updater): ContractDocument
    {
        $document = ContractDocument::findOrFail($documentId);
        $oldData = $document->toArray();

        $document->update([
            'title' => trim($data['title']),
            'document_type' => (int)$data['document_type'],
            'description' => isset($data['description']) ? trim($data['description']) : $document->description,
        ]);

        // Ghi activity_logs
        $this->logActivity($updater->id, 'CONTRACT_DOCUMENT_UPDATE', $document->id, $oldData, $document->fresh()->toArray());

        return $document->fresh(['uploader', 'extension']);
    }

    /**
     * Xóa mềm tài liệu hợp đồng (Spec mục 3.5)
     */
    public function deleteDocument(int $documentId, User $deleter): bool
    {
        $document = ContractDocument::with('contract')->findOrFail($documentId);
        $contract = $document->contract;

        // Quy tắc: Không cho xóa tài liệu "Hợp đồng chính" nếu đó là file chính duy nhất của hợp đồng đang status = 1 (Hiệu lực). Trả 409
        if ((int)$document->document_type === ContractDocument::TYPE_MAIN && (int)($contract?->status) === 1) {
            $mainDocCount = ContractDocument::where('contract_id', $document->contract_id)
                ->where('document_type', ContractDocument::TYPE_MAIN)
                ->whereNull('deleted_at')
                ->count();

            if ($mainDocCount <= 1) {
                throw new InvalidArgumentException(
                    'Không thể xóa tệp Hợp đồng chính duy nhất của hợp đồng đang có hiệu lực pháp lý.',
                    409
                );
            }
        }

        $oldData = $document->toArray();

        // Xóa mềm Eloquent, giữ lại file vật lý trên đĩa
        $document->delete();

        // Ghi activity_logs
        $this->logActivity($deleter->id, 'CONTRACT_DOCUMENT_DELETE', $document->id, $oldData, null);

        return true;
    }

    /**
     * Xem trước file (stream inline)
     */
    public function previewDocument(int $documentId, User $viewer): StreamedResponse|BinaryFileResponse
    {
        $document = ContractDocument::findOrFail($documentId);

        if (!Storage::disk('local')->exists($document->file_url)) {
            abort(404, 'Tệp tài liệu vật lý không tồn tại trên máy chủ.');
        }

        // Ghi activity_logs xem tài liệu (truy vết)
        $this->logActivity($viewer->id, 'CONTRACT_DOCUMENT_VIEW', $document->id, null, [
            'original_name' => $document->original_name,
            'role_id' => $viewer->role_id,
        ]);

        $filePath = Storage::disk('local')->path($document->file_url);

        return response()->file($filePath, [
            'Content-Type' => $document->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . addslashes($document->original_name) . '"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Tải xuống tài liệu (attachment stream)
     */
    public function downloadDocument(int $documentId, User $downloader): StreamedResponse|BinaryFileResponse
    {
        $document = ContractDocument::findOrFail($documentId);

        if (!Storage::disk('local')->exists($document->file_url)) {
            abort(404, 'Tệp tài liệu vật lý không tồn tại trên máy chủ.');
        }

        // Ghi activity_logs tải tài liệu (truy vết)
        $this->logActivity($downloader->id, 'CONTRACT_DOCUMENT_DOWNLOAD', $document->id, null, [
            'original_name' => $document->original_name,
            'file_size' => $document->file_size,
            'role_id' => $downloader->role_id,
        ]);

        return Storage::disk('local')->download($document->file_url, $document->original_name, [
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Helper ghi activity_logs an toàn
     */
    protected function logActivity(?int $userId, string $action, int $recordId, ?array $oldData, ?array $newData): void
    {
        try {
            if (Schema::hasTable('activity_logs')) {
                DB::table('activity_logs')->insert([
                    'user_id' => $userId,
                    'action' => $action,
                    'table_name' => 'contract_documents',
                    'record_id' => $recordId,
                    'old_data' => $oldData ? json_encode($oldData, JSON_UNESCAPED_UNICODE) : null,
                    'new_data' => $newData ? json_encode($newData, JSON_UNESCAPED_UNICODE) : null,
                    'ip_address' => request()->ip(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning("Không thể ghi activity_logs cho action {$action}: " . $e->getMessage());
        }
    }
}
