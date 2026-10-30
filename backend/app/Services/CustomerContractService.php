<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CustomerContractService
{
    /**
     * Danh sách hợp đồng của khách hàng (loại bỏ hợp đồng nháp status = 0 và đã xóa mềm)
     */
    public function getMyContracts(User $customer, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Contract::with(['property', 'broker'])
            ->where('customer_id', $customer->id)
            ->where('status', '!=', 0) // Hợp đồng nháp (status = 0) khách hàng KHÔNG ĐƯỢC THẤY (Spec mục 3.4)
            ->whereNull('deleted_at')
            ->withCount(['documents as documents_count' => function ($q) {
                // Chỉ đếm tài liệu khách được phép thấy: {0 HĐ chính, 1 Phụ lục, 4 Bàn giao/thanh lý}
                $q->whereIn('document_type', ContractDocument::CUSTOMER_ALLOWED_TYPES)
                  ->whereNull('deleted_at');
            }]);

        // Tìm kiếm theo mã hợp đồng hoặc tên hợp đồng
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $search);

            $query->where(function ($q) use ($escaped) {
                $q->where('contract_code', 'LIKE', "%{$escaped}%")
                  ->orWhere('contract_name', 'LIKE', "%{$escaped}%");
            });
        }

        // Lọc theo trạng thái hợp đồng (1: Đang hiệu lực, 2: Đã thanh lý, 3: Đã hủy)
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int)$filters['status']);
        }

        // Sắp xếp mặc định: hợp đồng đang hiệu lực (status = 1) lên trước, sau đó theo ngày tạo mới nhất (Spec mục 4.B2)
        return $query->orderByRaw('CASE WHEN status = 1 THEN 0 ELSE 1 END')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Chi tiết 1 hợp đồng của khách hàng
     */
    public function getMyContractDetail(int $contractId, User $customer): Contract
    {
        $query = Contract::with(['property', 'broker', 'customer', 'extensions'])
            ->where('id', $contractId)
            ->whereNull('deleted_at');

        if ((int)$customer->role_id !== 1) {
            $query->where('customer_id', $customer->id)
                  ->where('status', '!=', 0); // Không lộ hợp đồng nháp với khách
        }

        $contract = $query->first();

        if (!$contract) {
            abort(404, 'Không tìm thấy hợp đồng hoặc bạn không có quyền xem thông tin hợp đồng này.');
        }

        return $contract;
    }

    /**
     * Danh sách tài liệu hợp đồng mà khách hàng được phép xem ({0, 1, 4})
     */
    public function getMyContractDocuments(int $contractId, User $customer): Collection
    {
        $query = Contract::where('id', $contractId)->whereNull('deleted_at');
        if ((int)$customer->role_id !== 1) {
            $query->where('customer_id', $customer->id)->where('status', '!=', 0);
        }
        $contract = $query->first();

        if (!$contract) {
            abort(404, 'Không tìm thấy hợp đồng hợp lệ.');
        }

        return ContractDocument::where('contract_id', $contract->id)
            ->whereIn('document_type', ContractDocument::CUSTOMER_ALLOWED_TYPES)
            ->whereNull('deleted_at')
            ->latest('id')
            ->get();
    }
}
