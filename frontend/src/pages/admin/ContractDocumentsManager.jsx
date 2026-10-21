import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Plus, UploadCloud, RefreshCw, Eye, Download,
  Edit3, Trash2, Calendar, Filter, X, Building2, User, CheckCircle2,
  AlertCircle, ShieldCheck, FileCheck, Layers, ArrowUpDown, ChevronLeft,
  ChevronRight, FolderOpen, AlertTriangle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContractsWithDocsThunk,
  setFilters,
  resetFilters,
  setActiveContract,
} from '../../store/slices/contractDocumentSlice';
import UploadContractDocumentModal, { DOCUMENT_TYPES } from '../../components/UploadContractDocumentModal';
import ContractDocumentListModal from '../../components/ContractDocumentListModal';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';

export default function ContractDocumentsManager({ currentUser, onNavigateToContracts }) {
  const dispatch = useDispatch();
  const {
    contractsList,
    pagination,
    filters,
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.contractDocument);

  // Local state for search debounce
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedContractForDocs, setSelectedContractForDocs] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync debounce search to Redux
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(setFilters({ search: searchTerm, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, dispatch]);

  // Fetch contracts whenever filters change
  const loadData = useCallback(() => {
    dispatch(fetchContractsWithDocsThunk(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flash toast
  useEffect(() => {
    if (successMessage) {
      setToastMessage(successMessage);
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(resetFilters());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      dispatch(setFilters({ page: newPage }));
    }
  };

  // Status badge styling
  const renderStatusBadge = (status, label) => {
    switch (Number(status)) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {label || 'Đang có hiệu lực'}
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {label || 'Chờ ký / Nháp'}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {label || 'Đã thanh lý'}
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {label || 'Đã hủy'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {label || 'N/A'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header (Hình 42) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Quản Lý Tài Liệu Hợp Đồng
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý, lưu trữ và lưu hành các tệp tài liệu hợp đồng bảo mật theo tiêu chuẩn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải lên Hợp đồng Mới</span>
          </button>

          {onNavigateToContracts && (
            <button
              onClick={onNavigateToContracts}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Hợp Đồng</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar (Hình 42) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search box (Debounce 400ms) */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ, tên HĐ, khách hàng, tên file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="1">Đang có hiệu lực</option>
              <option value="0">Chờ ký / Nháp</option>
              <option value="2">Đã thanh lý / Hết hạn</option>
              <option value="3">Đã hủy</option>
            </select>
          </div>

          {/* Filter Document Type */}
          <div>
            <select
              value={filters.document_type}
              onChange={(e) => handleFilterChange('document_type', e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">-- Tất cả loại tài liệu --</option>
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center">
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>

        {/* Date range filter row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-bold flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Ngày tạo:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
            <span>đến</span>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {(filters.date_from || filters.date_to) && (
            <button
              onClick={() => {
                handleFilterChange('date_from', '');
                handleFilterChange('date_to', '');
              }}
              className="text-red-600 hover:underline text-[11px] font-semibold"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table (Hình 42) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-28">Mã Hợp Đồng</th>
                <th className="py-3.5 px-4 min-w-[220px]">Tên Hợp Đồng & BĐS</th>
                <th className="py-3.5 px-4 min-w-[180px]">Khách Hàng (Bên B)</th>
                <th className="py-3.5 px-4 w-32">Ngày Hết Hạn</th>
                <th className="py-3.5 px-4 w-36">Trạng Thái</th>
                <th className="py-3.5 px-4 w-28 text-center">Số Tài Liệu</th>
                <th className="py-3.5 px-4 w-32 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading && contractsList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs">Đang tải danh sách hợp đồng...</p>
                  </td>
                </tr>
              ) : contractsList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Không tìm thấy hợp đồng nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử thay đổi bộ lọc hoặc tải lên hồ sơ tài liệu hợp đồng mới.
                    </p>
                  </td>
                </tr>
              ) : (
                contractsList.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedContractForDocs(contract)}
                  >
                    {/* ID / Mã HĐ */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-blue-600 font-mono">
                        {contract.contract_code}
                      </span>
                    </td>

                    {/* Tên HĐ & BĐS */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                        {contract.contract_name || 'Hợp đồng thuê'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{contract.property?.title || contract.property_title || 'Chưa liên kết'}</span>
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{contract.customer?.name || 'Chưa cập nhật'}</span>
                      </div>
                      {contract.customer?.phone && (
                        <div className="text-[11px] text-slate-500 pl-5">
                          {contract.customer.phone}
                        </div>
                      )}
                    </td>

                    {/* Ngày hết hạn */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {contract.end_date || '—'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(contract.status, contract.status_label)}
                    </td>

                    {/* Số tài liệu */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        (contract.documents_count || 0) > 0
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {contract.documents_count || 0} tệp
                      </span>
                    </td>

                    {/* Cột Hành Động */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedContractForDocs(contract)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ tài liệu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedContractForDocs(contract)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin hồ sơ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <strong className="text-slate-800">{contractsList.length}</strong> trên tổng số <strong className="text-slate-800">{pagination.total}</strong> hợp đồng
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700">
                Trang {pagination.current_page} / {pagination.last_page || 1}
              </span>

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Contract Document Modal */}
      {showUploadModal && (
        <UploadContractDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          allContracts={contractsList}
          onSuccess={() => loadData()}
        />
      )}

      {/* Contract Document List Modal */}
      {selectedContractForDocs && (
        <ContractDocumentListModal
          isOpen={!!selectedContractForDocs}
          onClose={() => setSelectedContractForDocs(null)}
          contract={selectedContractForDocs}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
