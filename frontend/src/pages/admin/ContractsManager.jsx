import React, { useState, useEffect } from 'react';
import {
  FileText, Save, CheckCircle, AlertTriangle, Building, User, DollarSign,
  Calendar, Plus, RefreshCw, Eye, Download, X, Trash2, Edit3, ShieldAlert,
  MapPin, CheckSquare, Clock, ArrowRight, ShieldCheck, FileCheck, HelpCircle,
  History, CalendarPlus, FolderOpen, Receipt, Printer, ArrowLeft, ChevronRight
} from 'lucide-react';
import ExtendContractPage from './ExtendContractPage';
import ContractExtensionHistoryModal from '../../components/ContractExtensionHistoryModal';
import ContractDocumentListModal from '../../components/ContractDocumentListModal';
import ContractA4Document from '../../components/ContractA4Document';

export default function ContractsManager({ currentUser }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'extend'
  const [extendingContractId, setExtendingContractId] = useState(null);
  const [historyModalContract, setHistoryModalContract] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);
  const [adminDetailTab, setAdminDetailTab] = useState('a4');
  const [statusModalContract, setStatusModalContract] = useState(null);
  const [documentModalContract, setDocumentModalContract] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // List State
  const [contracts, setContracts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [highValueFilter, setHighValueFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    contract_code: '',
    contract_name: '',
    property_id: '',
    broker_id: '',
    customer_id: '',
    start_date: '',
    end_date: '',
    deposit_amount: '',
    rental_price: '',
    currency: 'VND',
    party_a_info: '',
    party_b_info: '',
    tax_code: '',
    terms: '',
    signing_method: 'ONLINE', // 'ONLINE' or 'DIRECT_MEETING'
    meeting_location: '',
    meeting_time: '',
    notary_office: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Tự động phát hiện BĐS có số tiền lớn (>= 5 Tỷ hoặc cọc >= 500 Triệu)
  const isHighValue = React.useMemo(() => {
    const price = parseFloat(formData.rental_price) || 0;
    const deposit = parseFloat(formData.deposit_amount) || 0;
    return price >= 5000000000 || deposit >= 500000000;
  }, [formData.rental_price, formData.deposit_amount]);

  // Khi phát hiện giá trị lớn, tự động ép phương thức ký là DIRECT_MEETING
  useEffect(() => {
    if (isHighValue) {
      setFormData(prev => ({
        ...prev,
        signing_method: 'DIRECT_MEETING',
        meeting_location: prev.meeting_location || 'Văn phòng Công chứng Bến Nghé (Quận 1, TP.HCM)'
      }));
    }
  }, [isHighValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getHeaders = () => {
    const token = localStorage.getItem('3tv_token') || '';
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Fetch danh sách hợp đồng
  const fetchContracts = async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== '') params.append('status', statusFilter);
      if (highValueFilter !== '') params.append('is_high_value', highValueFilter);

      let res = await fetch(`/api/contracts?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/contracts?${params.toString()}`, { headers: getHeaders() });
      }
      const data = await res.json();
      setContracts(data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải hợp đồng:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchContracts();
    }
  }, [activeTab, searchTerm, statusFilter, highValueFilter]);

  // Tạo hợp đồng mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Ràng buộc kiểm tra giao dịch giá trị lớn
    if (isHighValue && !formData.meeting_location) {
      setError('Bất động sản giá trị lớn (≥ 5 Tỷ) bắt buộc phải nhập địa điểm gặp mặt ký kết và công chứng trực tiếp!');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, is_high_value: isHighValue };
      if (payload.deposit_amount === '') delete payload.deposit_amount;
      if (payload.rental_price === '') delete payload.rental_price;
      if (isHighValue) payload.signing_method = 'DIRECT_MEETING';

      let res = await fetch('/api/contracts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8080/api/contracts', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra khi tạo hợp đồng.');
      }

      setSuccess(data.message || 'Tạo hợp đồng thành công!');
      // Reset form
      setFormData({
        contract_code: '',
        contract_name: '',
        property_id: '',
        broker_id: '',
        customer_id: '',
        start_date: '',
        end_date: '',
        deposit_amount: '',
        rental_price: '',
        currency: 'VND',
        party_a_info: '',
        party_b_info: '',
        tax_code: '',
        terms: '',
        signing_method: 'ONLINE',
        meeting_location: '',
        meeting_time: '',
        notary_office: '',
      });

      // Tự động chuyển về danh sách sau 1.5 giây
      setTimeout(() => {
        setActiveTab('list');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái hợp đồng (Spec Hình 40)
  const handleUpdateStatus = async () => {
    if (!statusModalContract) return;
    setStatusUpdating(true);
    try {
      let res = await fetch(`/api/contracts/${statusModalContract.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: selectedNewStatus })
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/contracts/${statusModalContract.id}/status`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status: selectedNewStatus })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái hợp đồng.');
      }

      // Cập nhật state trực tiếp
      setContracts(prev => prev.map(c => c.id === statusModalContract.id ? { ...c, status: selectedNewStatus } : c));
      setStatusModalContract(null);
      alert(data.message || 'Đã cập nhật trạng thái hợp đồng thành công!');
    } catch (err) {
      alert(`[LỖI]: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Xóa hợp đồng (Spec Hình 39 - Nút Thùng Rác)
  const handleDeleteContract = async (id, code) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng "${code}" khỏi hệ thống không?`)) {
      return;
    }
    setDeleteLoading(id);
    try {
      let res = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/contracts/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa hợp đồng thất bại.');

      setContracts(prev => prev.filter(c => c.id !== id));
      alert(data.message || 'Đã xóa hợp đồng thành công!');
    } catch (err) {
      alert(`[LỖI]: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (Number(status)) {
      case 0: return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-bold inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Nháp/Chờ ký</span>;
      case 1: return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đang hiệu lực</span>;
      case 2: return <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-full font-bold inline-flex items-center gap-1"><FileCheck className="w-3 h-3" /> Đã thanh lý</span>;
      case 3: return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold inline-flex items-center gap-1"><X className="w-3 h-3" /> Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col font-sans">

      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Quản Lý & Trạng Thái Hợp Đồng</h3>
            <p className="text-xs text-slate-500">Soạn thảo, theo dõi tiến độ pháp lý và quản lý hợp đồng BĐS</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('list');
              setExtendingContractId(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'list'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            📋 Danh Sách & Trạng Thái
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setExtendingContractId(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'create'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            ✍️ Tạo Hợp Đồng Mới
          </button>
          {activeTab === 'extend' && extendingContractId && (
            <button
              onClick={() => setActiveTab('extend')}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all bg-white text-indigo-700 shadow-sm flex items-center gap-1.5"
            >
              🔄 Phụ Lục Gia Hạn HĐ #{extendingContractId}
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
        {activeTab === 'extend' && extendingContractId ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <ExtendContractPage
              contractId={extendingContractId}
              onBack={() => {
                setExtendingContractId(null);
                setActiveTab('list');
                fetchContracts();
              }}
              currentUser={currentUser}
            />
          </div>
        ) : activeTab === 'list' ? (
          <div className="p-4 sm:p-6 h-full flex flex-col">

            {/* Filter Bar (Hình 39 & Hình 40) */}
            <div className="flex flex-wrap items-center gap-3 mb-5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <input
                type="text"
                placeholder="Tìm mã HĐ, tên HĐ, khách hàng..."
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-full sm:w-72 focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Lọc Trạng Thái */}
              <select
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="0">Nháp / Chờ ký</option>
                <option value="1">Đang hiệu lực</option>
                <option value="2">Hết hạn / Thanh lý</option>
                <option value="3">Đã hủy</option>
              </select>

              {/* Lọc BĐS Giá trị lớn */}
              <select
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
                value={highValueFilter}
                onChange={(e) => setHighValueFilter(e.target.value)}
              >
                <option value="">Tất cả phân loại giao dịch</option>
                <option value="1">👑 BĐS Giá Trị Lớn (≥ 5 Tỷ)</option>
                <option value="0">Tiêu chuẩn / Ký online</option>
              </select>

              <button
                onClick={fetchContracts}
                className="ml-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin text-blue-600' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Table Area (Hình 39 & Hình 40) */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
              {listLoading && contracts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium">Đang tải danh sách hợp đồng...</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Mã Hợp Đồng</th>
                        <th className="px-4 py-3.5">Tên Hợp Đồng & BĐS</th>
                        <th className="px-4 py-3.5">Khách Hàng</th>
                        <th className="px-4 py-3.5">Hình Thức Ký</th>
                        <th className="px-4 py-3.5">Giá Trị</th>
                        <th className="px-4 py-3.5">Trạng Thái</th>
                        <th className="px-4 py-3.5 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {contracts.map(c => {
                        const isHigh = c.is_high_value || (Number(c.rental_price) >= 5000000000);
                        return (
                          <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                            {/* Mã HĐ */}
                            <td className="px-4 py-3.5">
                              <div className="font-extrabold text-blue-600">{c.contract_code}</div>
                              {isHigh && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                                  Giá Trị Cao
                                </span>
                              )}
                            </td>

                            {/* Tên HĐ & BĐS */}
                            <td className="px-4 py-3.5">
                              <div className="text-slate-900 font-bold max-w-xs truncate" title={c.contract_name}>
                                {c.contract_name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                                {c.property?.title ? `BĐS: ${c.property.title}` : `Property ID: #${c.property_id}`}
                              </div>
                            </td>

                            {/* Khách hàng */}
                            <td className="px-4 py-3.5">
                              <div className="text-slate-800 font-semibold">
                                {c.customer?.name || `Customer #${c.customer_id}`}
                              </div>
                              <div className="text-xs text-slate-500">
                                {c.customer?.phone || c.customer?.email || 'N/A'}
                              </div>
                            </td>

                            {/* Hình thức ký */}
                            <td className="px-4 py-3.5">
                              {c.signing_method === 'DIRECT_MEETING' || isHigh ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    <MapPin className="w-3 h-3" />
                                    Ký Trực Tiếp & Công Chứng
                                  </span>
                                  {c.meeting_location && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1" title={c.meeting_location}>
                                      📍 {c.meeting_location}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                                  <ShieldCheck className="w-3 h-3" />
                                  Ký Điện Tử (Online)
                                </span>
                              )}
                            </td>

                            {/* Giá trị */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">
                                {(Number(c.rental_price) || 0).toLocaleString('vi-VN')} {c.currency}
                              </div>
                              {Number(c.deposit_amount) > 0 && (
                                <div className="text-xs text-emerald-600 font-semibold">
                                  Cọc: {(Number(c.deposit_amount) || 0).toLocaleString('vi-VN')} {c.currency}
                                </div>
                              )}
                            </td>

                            {/* Trạng thái hợp đồng (Hình 40) */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(c.status)}
                                <button
                                  onClick={() => {
                                    setStatusModalContract(c);
                                    setSelectedNewStatus(c.status);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Cập nhật trạng thái hợp đồng (Hình 40)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Cột hành động (Hình 39) */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Nút Xem Chi Tiết */}
                                <button
                                  onClick={() => setViewingContract(c)}
                                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Xem chi tiết & In Hợp Đồng"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Nút Gia Hạn Hợp Đồng (Hình 41) */}
                                <button
                                  onClick={() => {
                                    setExtendingContractId(c.id);
                                    setActiveTab('extend');
                                  }}
                                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Gia Hạn Hợp Đồng"
                                >
                                  <CalendarPlus className="w-4 h-4" />
                                </button>

                                {/* Nút Lịch Sử Gia Hạn & Phê Duyệt */}
                                <button
                                  onClick={() => setHistoryModalContract(c)}
                                  className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Lịch Sử Gia Hạn & Phê Duyệt"
                                >
                                  <History className="w-4 h-4" />
                                </button>

                                {/* Nút Hồ Sơ Tài Liệu Hợp Đồng (Hình 42) */}
                                <button
                                  onClick={() => setDocumentModalContract(c)}
                                  className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Hồ Sơ Tài Liệu Hợp Đồng"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </button>

                                {/* Nút Hóa Đơn Hợp Đồng (Hình 46) */}
                                <button
                                  onClick={() => {
                                    localStorage.setItem('3tv_admin_active_menu', 'invoices');
                                    window.location.hash = '#admin/invoices';
                                  }}
                                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Quản lý Hóa Đơn (Hình 46)"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>

                                {/* Nút Cập Nhật Trạng Thái (Hình 40) */}
                                <button
                                  onClick={() => {
                                    setStatusModalContract(c);
                                    setSelectedNewStatus(c.status);
                                  }}
                                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Đổi trạng thái hợp đồng"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>

                                {/* Nút Xóa (Hình 39) */}
                                <button
                                  onClick={() => handleDeleteContract(c.id, c.contract_code)}
                                  disabled={deleteLoading === c.id}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Xóa hợp đồng khỏi hệ thống"
                                >
                                  <Trash2 className={`w-4 h-4 ${deleteLoading === c.id ? 'animate-spin' : ''}`} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {contracts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                            Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB TẠO HỢP ĐỒNG MỚI (Hình 38) */
          <div className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

              {/* Alert Messages */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Lỗi xác thực nghiệp vụ</h4>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 shadow-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Thành công!</h4>
                    <p className="text-xs text-emerald-600 mt-1">{success}</p>
                  </div>
                </div>
              )}

              {/* BANNER ĐẶC BIỆT: PHÁT HIỆN GIAO DỊCH GIÁ TRỊ LỚN (HIGH VALUE TRANSACTION) */}
              {isHighValue && (
                <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border-2 border-amber-400/80 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-amber-900 uppercase tracking-wide flex items-center gap-2">
                        Bảo đảm pháp lý: Giao dịch BĐS giá trị lớn (≥ 5 Tỷ VNĐ)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Theo quy định của <strong>Luật Kinh doanh Bất động sản</strong> và <strong>Luật Công chứng Việt Nam</strong>, với các tài sản có giá trị lớn, các bên <strong>BẮT BUỘC GẶP MẶT TRỰC TIẾP</strong> tại Văn phòng Công chứng hoặc Trụ sở Sàn để:
                      </p>
                      <ul className="mt-2 text-xs text-amber-800 space-y-1 pl-4 list-disc font-medium">
                        <li>Kiểm tra và đối chiếu bản gốc <strong>Giấy chứng nhận quyền sở hữu (Sổ hồng / Sổ đỏ)</strong> để phòng chống rủi ro làm giả.</li>
                        <li>Xác minh danh tính qua <strong>CCCD gắn chip</strong> và kiểm tra thực tế năng lực hành vi dân sự của chủ sở hữu.</li>
                        <li>Ký tên và lăn tay trực tiếp dưới sự chứng kiến của <strong>Công chứng viên</strong> trước khi bàn giao tài sản.</li>
                      </ul>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs">
                        🔒 Hệ thống đã tự động khóa phương thức: "Gặp mặt ký trực tiếp & Công chứng"
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Block 1: Thông tin cơ bản */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
                  1. Thông Tin Cơ Bản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mã Hợp Đồng *</label>
                    <input
                      required
                      type="text"
                      name="contract_code"
                      value={formData.contract_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                      placeholder="VD: HDMB-2026-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tên Hợp Đồng *</label>
                    <input
                      required
                      type="text"
                      name="contract_name"
                      value={formData.contract_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                      placeholder="VD: Hợp đồng mua bán căn hộ Landmark 81"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Bất Động Sản *</label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        type="number"
                        name="property_id"
                        value={formData.property_id}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="ID BĐS trong hệ thống..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Môi Giới *</label>
                      <input
                        required
                        type="number"
                        name="broker_id"
                        value={formData.broker_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Broker ID (VD: 2)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Khách Hàng *</label>
                      <input
                        required
                        type="number"
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Customer ID (VD: 5)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2: Thời hạn & Tài chính (Có cơ chế phát hiện số tiền lớn) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-4 bg-amber-500 rounded-full"></span>
                    2. Giá Trị Hợp Đồng & Thời Hạn
                  </div>
                  <span className="text-xs text-slate-500 font-normal">Ngưỡng BĐS giá trị lớn: ≥ 5 Tỷ VNĐ</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Giá Trị / Giá Thuê (VNĐ) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        type="number"
                        name="rental_price"
                        value={formData.rental_price}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-800"
                        placeholder="VD: 5000000000 (5 Tỷ)"
                      />
                    </div>
                    {formData.rental_price && (
                      <p className="text-[11px] text-blue-600 font-semibold mt-1">
                        Bằng chữ: {(Number(formData.rental_price)).toLocaleString('vi-VN')} {formData.currency}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Tiền Cọc (VNĐ - Tùy chọn)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        name="deposit_amount"
                        value={formData.deposit_amount}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="VD: 500000000 (500 Triệu)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Ngày Bắt Đầu Hiệu Lực *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Ngày Kết Thúc Hợp Đồng *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 3: Phương thức ký kết & Gặp mặt trực tiếp (YÊU CẦU NGHIỆP VỤ MỚI) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-4 bg-purple-600 rounded-full"></span>
                  3. Hình Thức Ký Kết & Gặp Mặt Công Chứng
                </h4>

                <div className="space-y-4">
                  {/* Lựa chọn hình thức ký */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all ${formData.signing_method === 'DIRECT_MEETING'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <input
                        type="radio"
                        name="signing_method"
                        value="DIRECT_MEETING"
                        checked={formData.signing_method === 'DIRECT_MEETING'}
                        onChange={handleChange}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          Gặp Mặt Ký Trực Tiếp & Công Chứng
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Bắt buộc cho BĐS giá trị lớn (≥ 5 Tỷ) hoặc theo yêu cầu đối chiếu Sổ hồng gốc tại văn phòng công chứng.
                        </p>
                      </div>
                    </label>

                    <label className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all ${isHighValue
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                      : formData.signing_method === 'ONLINE'
                        ? 'border-blue-600 bg-blue-50/50 cursor-pointer'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                      }`}>
                      <input
                        type="radio"
                        name="signing_method"
                        value="ONLINE"
                        disabled={isHighValue}
                        checked={formData.signing_method === 'ONLINE'}
                        onChange={handleChange}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          Ký Điện Tử Trực Tuyến (E-Sign)
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Áp dụng cho hợp đồng đặt cọc giữ chỗ hoặc giao dịch thuê phòng/căn hộ giá trị nhỏ (&lt; 5 Tỷ).
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Chi tiết lịch hẹn gặp mặt nếu chọn DIRECT_MEETING */}
                  {formData.signing_method === 'DIRECT_MEETING' && (
                    <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-4">
                      <h5 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-700" />
                        Kế Hoạch Gặp Mặt Ký Kết Trực Tiếp
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-purple-950 mb-1.5 uppercase">
                            Địa Điểm Gặp Mặt Ký Kết *
                          </label>
                          <input
                            required={isHighValue}
                            type="text"
                            name="meeting_location"
                            value={formData.meeting_location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="VD: Văn phòng Công chứng Bến Nghé, Quận 1 hoặc Trụ sở 3TV Land"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-950 mb-1.5 uppercase">
                            Thời Gian Hẹn Ký Trực Tiếp
                          </label>
                          <input
                            type="datetime-local"
                            name="meeting_time"
                            value={formData.meeting_time}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-slate-700"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-purple-950 mb-1.5 uppercase">
                            Văn Phòng Công Chứng Phụ Trách (Nếu có)
                          </label>
                          <input
                            type="text"
                            name="notary_office"
                            value={formData.notary_office}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="VD: Văn phòng công chứng TP. Hồ Chí Minh"
                          />
                        </div>
                      </div>

                      {/* Checklist hồ sơ gốc cần mang theo */}
                      <div className="pt-2 border-t border-purple-200/80">
                        <p className="text-xs font-bold text-purple-950 mb-2">📋 Hồ sơ gốc hai bên cần mang theo khi gặp mặt:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-purple-900">
                          <div className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Bản gốc Giấy chứng nhận QSDĐ (Sổ đỏ/Sổ hồng)</div>
                          <div className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Bản gốc CCCD gắn chip của Bên A và Bên B</div>
                          <div className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Giấy xác nhận tình trạng hôn nhân/độc thân</div>
                          <div className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Hợp đồng ủy quyền hợp pháp (nếu ủy quyền)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Block 4: Thông tin các bên & Điều khoản */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-4 bg-emerald-600 rounded-full"></span>
                  4. Thông Tin Các Bên & Điều Khoản Ràng Buộc
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Bên A (Chủ Nhà / Bên Bán)</label>
                      <textarea
                        name="party_a_info"
                        value={formData.party_a_info}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[85px]"
                        placeholder="Họ tên, CCCD, Địa chỉ thường trú, SĐT Bên A..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Bên B (Khách Hàng / Bên Mua / Thuê)</label>
                      <textarea
                        name="party_b_info"
                        value={formData.party_b_info}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[85px]"
                        placeholder="Họ tên, CCCD, Địa chỉ thường trú, SĐT Bên B..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mã Số Thuế / Số Hồ Sơ Pháp Lý</label>
                    <input
                      type="text"
                      name="tax_code"
                      value={formData.tax_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Mã số thuế hoặc số công chứng..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Điều Khoản Hợp Đồng Bổ Sung</label>
                    <textarea
                      name="terms"
                      value={formData.terms}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px]"
                      placeholder="Các điều khoản thỏa thuận bàn giao nhà, phương thức thanh toán từng đợt..."
                    />
                  </div>
                </div>
              </div>

              {/* Nút Submit Form */}
              <div className="flex items-center justify-end gap-3 pb-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Đang Xử Lý...' : 'Hoàn Tất & Tạo Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL 1: CẬP NHẬT TRẠNG THÁI HỢP ĐỒNG (Spec Hình 40) */}
      {statusModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Quản Lý Trạng Thái Hợp Đồng</h4>
                <p className="text-xs text-slate-500">Mã HĐ: <span className="font-bold text-blue-600">{statusModalContract.contract_code}</span></p>
              </div>
              <button
                onClick={() => setStatusModalContract(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Chọn trạng thái mới:</label>

              {[
                { val: 0, label: '0. Nháp / Chờ Ký (Pending/Draft)', desc: 'Hợp đồng đang soạn thảo, chờ các bên ký duyệt.' },
                { val: 1, label: '1. Đang Có Hiệu Lực (Active)', desc: 'Tự động đồng bộ chuyển BĐS sang trạng thái Đã Bán / Cho Thuê.' },
                { val: 2, label: '2. Đã Thanh Lý / Hết Hạn (Terminated)', desc: 'Hợp đồng đã kết thúc, giải phóng BĐS.' },
                { val: 3, label: '3. Đã Hủy (Cancelled)', desc: 'Hợp đồng bị hủy bỏ do vi phạm hoặc hai bên đồng thuận hủy.' }
              ].map(item => (
                <label
                  key={item.val}
                  className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${selectedNewStatus === item.val
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="status_radio"
                    value={item.val}
                    checked={selectedNewStatus === item.val}
                    onChange={() => setSelectedNewStatus(item.val)}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalContract(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-md"
              >
                {statusUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Xác Nhận Đổi Trạng Thái
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHI TIẾT & XUẤT IN PDF HỢP ĐỒNG (CHUẨN KHỔ A4 ĐỒNG BỘ KHÁCH HÀNG) */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-xs p-0 sm:p-4 md:p-6 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-slate-100 min-h-full sm:rounded-2xl w-full max-w-5xl mx-auto flex flex-col shadow-2xl overflow-hidden print:bg-white print:shadow-none print:w-full print:max-w-none">

            {/* Header Toolbar (Ẩn khi in ấn) */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs no-print">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <button
                  onClick={() => setViewingContract(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {viewingContract.contract_code}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                  {viewingContract.contract_name}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="In văn bản hợp đồng khổ A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Hợp Đồng (A4)</span>
                </button>
                <button
                  onClick={() => setViewingContract(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header Tabs & Status */}
            <div className="px-4 sm:px-6 py-3 bg-white/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3 no-print">
              <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setAdminDetailTab('a4')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    adminDetailTab === 'a4'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Văn Bản Hợp Đồng (Khổ A4)</span>
                </button>

                <button
                  onClick={() => {
                    const c = viewingContract;
                    setDocumentModalContract(c);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                  title="Xem hồ sơ & tài liệu đính kèm"
                >
                  <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hồ Sơ Đính Kèm</span>
                </button>

                {(viewingContract.extensions?.length > 0 || viewingContract.approved_extensions?.length > 0) && (
                  <button
                    onClick={() => {
                      const c = viewingContract;
                      setHistoryModalContract(c);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                    title="Xem lịch sử gia hạn"
                  >
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>Lịch Sử Gia Hạn ({(viewingContract.approved_extensions || viewingContract.extensions || []).length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  viewingContract.status === 1
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {['Nháp/Chờ ký', 'Đang hiệu lực', 'Đã thanh lý/Hết hạn', 'Đã hủy'][viewingContract.status] || 'Đang hiệu lực'}
                </span>

                {viewingContract.is_high_value && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>HĐ Giá Trị Lớn</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Container: Tờ giấy A4 chuẩn xác */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100/70 print:p-0 print:bg-white">
              <ContractA4Document
                contract={viewingContract}
                currentUser={currentUser}
                showWatermark={true}
              />
            </div>

          </div>
        </div>
      )}

      {/* Modal Lịch Sử & Phê Duyệt Gia Hạn */}
      {historyModalContract && (
        <ContractExtensionHistoryModal
          contract={historyModalContract}
          onClose={() => setHistoryModalContract(null)}
          currentUser={currentUser}
          onRefreshList={fetchContracts}
        />
      )}

      {/* Modal Hồ Sơ Tài Liệu Hợp Đồng (Hình 42) */}
      {documentModalContract && (
        <ContractDocumentListModal
          isOpen={!!documentModalContract}
          onClose={() => setDocumentModalContract(null)}
          contract={documentModalContract}
          currentUser={currentUser}
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-contract, .printable-contract * { visibility: visible; }
          .printable-contract { position: absolute; left: 0; top: 0; width: 100%; padding: 25px; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
        }
      `}</style>
    </div>
  );
}
