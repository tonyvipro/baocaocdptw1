import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Search, Filter, RefreshCw, Eye, Download,
  Mail, Edit3, XCircle, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, Clock, Calendar, DollarSign, Building2, User,
  Trash2, X, AlertTriangle, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import invoiceApi from '../../services/invoiceApi';

export default function InvoicesManager({ currentUser, onSelectInvoice }) {
  const getQueryParam = (key) => {
    try {
      const hash = window.location.hash || '';
      const query = hash.includes('?') ? hash.split('?')[1] : window.location.search;
      return new URLSearchParams(query).get(key) || '';
    } catch {
      return '';
    }
  };

  // State danh sách
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(getQueryParam('search'));
  const [status, setStatus] = useState(getQueryParam('status'));
  const [type, setType] = useState(getQueryParam('type'));
  const [contractId, setContractId] = useState(getQueryParam('contract_id'));
  const [dueFrom, setDueFrom] = useState(getQueryParam('due_from'));
  const [dueTo, setDueTo] = useState(getQueryParam('due_to'));

  // Thống kê nhanh
  const [stats, setStats] = useState({
    total: 0,
    unpaid: 0,
    paid: 0,
    overdue: 0,
  });

  // Modal Lập / Sửa hóa đơn
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeContracts, setActiveContracts] = useState([]);
  const [formData, setFormData] = useState({
    contract_id: '',
    type: 'rent',
    title: '',
    due_date: '',
    billing_period_start: '',
    billing_period_end: '',
    note: '',
    items: [
      { item_name: 'Tiền thuê nhà', quantity: 1, unit_price: '', description: '' },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Modal Hủy
  const [cancelModalInvoice, setCancelModalInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Modal Email
  const [emailModalInvoice, setEmailModalInvoice] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState({ success: null, error: null });

  // Tải PDF state
  const [downloadingId, setDownloadingId] = useState(null);

  // 1. Fetch danh sách hóa đơn
  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        search: search.trim() || undefined,
        status: status !== '' ? status : undefined,
        type: type || undefined,
        contract_id: contractId || undefined,
        due_from: dueFrom || undefined,
        due_to: dueTo || undefined,
      };

      const res = await invoiceApi.fetchInvoices(params);
      setInvoices(res.data || []);
      if (res.meta) {
        setPagination({
          currentPage: res.meta.current_page,
          lastPage: res.meta.last_page,
          perPage: res.meta.per_page,
          total: res.meta.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  }, [search, status, type, contractId, dueFrom, dueTo]);

  // 2. Fetch danh sách hợp đồng hiệu lực (status = 1) cho modal tạo hóa đơn
  const fetchActiveContracts = async () => {
    try {
      const res = await axios.get('/api/contract-documents?per_page=100');
      // Lọc các hợp đồng status = 1
      const list = (res.data?.data || []).filter((c) => Number(c.status) === 1);
      setActiveContracts(list);
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchInvoices(1);
    fetchActiveContracts();
  }, [status, type, contractId, dueFrom, dueTo]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Cập nhật URL search params khi lọc
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== '') params.set('status', status);
      if (type) params.set('type', type);
      if (contractId) params.set('contract_id', contractId);
      if (dueFrom) params.set('due_from', dueFrom);
      if (dueTo) params.set('due_to', dueTo);
      const queryString = params.toString();
      const newHash = queryString ? `#admin/invoices?${queryString}` : '#admin/invoices';
      if (window.location.hash !== newHash && !window.location.hash.startsWith('#admin/invoices/')) {
        window.history.replaceState(null, '', newHash);
      }
    } catch (e) {}
  }, [search, status, type, contractId, dueFrom, dueTo]);

  const handleDownloadPdf = async (inv) => {
    try {
      setDownloadingId(inv.id);
      await invoiceApi.downloadPdf(inv.id, inv.invoice_no);
    } catch (err) {
      alert('Lỗi tải PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  const openSendEmail = (inv) => {
    setEmailModalInvoice(inv);
    setEmailInput(inv.customer_phone || '');
    setEmailResult({ success: null, error: null });
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailModalInvoice) return;
    try {
      setSendingEmail(true);
      setEmailResult({ success: null, error: null });
      const res = await invoiceApi.sendEmail(emailModalInvoice.id, emailInput.trim());
      setEmailResult({ success: res.message || 'Đã gửi hóa đơn thanh toán đến email của khách hàng!', error: null });
      setTimeout(() => {
        setEmailModalInvoice(null);
      }, 1600);
      fetchInvoices(pagination.currentPage);
    } catch (err) {
      setEmailResult({ success: null, error: err.response?.data?.message || 'Không thể gửi email hóa đơn.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalInvoice || !cancelReason.trim()) return;
    try {
      setCancelling(true);
      await invoiceApi.cancelInvoice(cancelModalInvoice.id, cancelReason.trim());
      setCancelModalInvoice(null);
      setCancelReason('');
      alert('Đã hủy hóa đơn thành công!');
      fetchInvoices(pagination.currentPage);
    } catch (err) {
      alert('Lỗi hủy hóa đơn: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelling(false);
    }
  };

  // Logic hạng mục động
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity: 1, unit_price: '', description: '' }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      return sum + q * p;
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormErrors({});

      const payload = {
        ...formData,
        contract_id: Number(formData.contract_id),
        items: formData.items.map((i) => ({
          item_name: i.item_name.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          description: i.description?.trim() || null,
        })),
      };

      if (editingInvoice) {
        await invoiceApi.updateInvoice(editingInvoice.id, payload);
        alert('Cập nhật hóa đơn thành công!');
      } else {
        await invoiceApi.createInvoice(payload);
        alert('Lập hóa đơn thanh toán thành công!');
      }

      setShowCreateModal(false);
      setEditingInvoice(null);
      fetchInvoices(1);
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data?.errors || {});
      } else {
        alert(err.response?.data?.message || 'Có lỗi xảy ra.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    setFormData({
      contract_id: activeContracts[0]?.id || '',
      type: 'rent',
      title: 'Tiền thuê tháng ' + new Date().getMonth() + 1 + '/' + new Date().getFullYear(),
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      billing_period_start: new Date().toISOString().split('T')[0],
      billing_period_end: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      note: '',
      items: [
        { item_name: 'Tiền thuê nhà', quantity: 1, unit_price: '', description: '1 tháng' },
      ],
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (inv) => {
    setEditingInvoice(inv);
    setFormData({
      contract_id: inv.contract_id,
      type: inv.type,
      title: inv.title,
      due_date: inv.due_date,
      billing_period_start: inv.billing_period_start || '',
      billing_period_end: inv.billing_period_end || '',
      note: inv.note || '',
      items: [
        { item_name: 'Tiền thuê nhà', quantity: 1, unit_price: inv.amount, description: '' },
      ],
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER & THẺ THỐNG KÊ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" /> Quản lý Hóa đơn & Tài chính
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các khoản thu tiền thuê, phí dịch vụ, cọc và trạng thái thanh toán
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              window.location.hash = '#my-invoices';
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Xem thử danh sách hóa đơn theo giao diện khách hàng (Hình 46)"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Xem giao diện khách</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Lập hóa đơn mới
          </button>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo số HĐ, mã HĐ, tên người thuê..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc trạng thái */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="0">Chưa thanh toán</option>
              <option value="1">Đã thanh toán</option>
              <option value="2">Quá hạn thanh toán</option>
              <option value="3">Đã hủy</option>
            </select>
          </div>

          {/* Lọc loại khoản thu */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
            >
              <option value="">Tất cả loại khoản thu</option>
              <option value="rent">Tiền thuê</option>
              <option value="service">Phí dịch vụ/tiện ích</option>
              <option value="deposit">Tiền đặt cọc</option>
              <option value="other">Khoản thu khác</option>
            </select>
          </div>

          {/* Nút reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setStatus('');
                setType('');
                setContractId('');
                setDueFrom('');
                setDueTo('');
              }}
              className="w-full py-2.5 px-3 text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH HÓA ĐƠN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Số hóa đơn</th>
                <th className="py-3.5 px-4">Hợp đồng / Căn hộ</th>
                <th className="py-3.5 px-4">Người thuê</th>
                <th className="py-3.5 px-4">Loại thu</th>
                <th className="py-3.5 px-4">Hạn TT</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                <th className="py-3.5 px-4 text-right">Còn nợ</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải dữ liệu hóa đơn...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
                    <p className="font-semibold text-rose-600">{error}</p>
                    <p className="text-xs text-slate-500 mt-1">Vui lòng đảm bảo bạn đã đăng nhập với tài khoản Admin hoặc Môi giới có quyền quản lý hóa đơn.</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Không tìm thấy hóa đơn nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Số hóa đơn */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectInvoice) onSelectInvoice(inv.id);
                          else window.location.hash = `#admin/invoices/${inv.id}`;
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline block font-mono text-left"
                      >
                        {inv.invoice_no}
                      </button>
                      <span className="text-xs text-slate-400">{formatDate(inv.issue_date)}</span>
                    </td>

                    {/* Hợp đồng / Căn hộ */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{inv.contract_code}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {inv.property_code || 'N/A'}
                      </div>
                    </td>

                    {/* Người thuê */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{inv.customer_name}</div>
                      {inv.customer_phone && (
                        <div className="text-xs text-slate-400">{inv.customer_phone}</div>
                      )}
                    </td>

                    {/* Loại thu */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {inv.type_label}
                      </span>
                    </td>

                    {/* Hạn thanh toán */}
                    <td className="py-3 px-4 text-xs">
                      <span className={Number(inv.status) === 2 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {formatDate(inv.due_date)}
                      </span>
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatVND(inv.amount)}
                    </td>

                    {/* Còn nợ */}
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      {inv.remaining > 0 ? formatVND(inv.remaining) : '-'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      {Number(inv.status) === 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Chưa TT
                        </span>
                      )}
                      {Number(inv.status) === 1 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đã TT
                        </span>
                      )}
                      {Number(inv.status) === 2 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Quá hạn
                        </span>
                      )}
                      {Number(inv.status) === 3 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" /> Đã hủy
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectInvoice) onSelectInvoice(inv.id);
                            else window.location.hash = `#admin/invoices/${inv.id}`;
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết (Hình 46)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={downloadingId === inv.id}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Tải PDF"
                        >
                          <Download className={`w-4 h-4 ${downloadingId === inv.id ? 'animate-bounce text-emerald-600' : ''}`} />
                        </button>

                        <button
                          onClick={() => openSendEmail(inv)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Gửi email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {(inv.status === 0 || inv.status === 2) && inv.paid_amount === 0 && (
                          <button
                            onClick={() => {
                              setCancelModalInvoice(inv);
                              setCancelReason('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hủy hóa đơn"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        {pagination.lastPage > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <div>
              Hiển thị trang <strong>{pagination.currentPage}</strong> / {pagination.lastPage} ({pagination.total} hóa đơn)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchInvoices(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchInvoices(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL LẬP / SỬA HÓA ĐƠN THỦ CÔNG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Lập hóa đơn thanh toán mới'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chọn hợp đồng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hợp đồng áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={!!editingInvoice}
                    required
                    value={formData.contract_id}
                    onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Chọn hợp đồng còn hiệu lực --</option>
                    {activeContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_code} - {c.customer_name} ({c.property_code || 'Căn hộ'})
                      </option>
                    ))}
                  </select>
                  {formErrors.contract_id && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.contract_id[0]}</p>
                  )}
                </div>

                {/* Loại khoản thu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Loại khoản thu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={!!editingInvoice}
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="rent">Tiền thuê (Rent)</option>
                    <option value="service">Phí dịch vụ/tiện ích (Service)</option>
                    <option value="deposit">Tiền đặt cọc (Deposit)</option>
                    <option value="other">Khoản thu khác (Other)</option>
                  </select>
                </div>

                {/* Tiêu đề */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Tiêu đề hóa đơn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Tiền thuê căn hộ tháng 11/2026..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.title && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.title[0]}</p>
                  )}
                </div>

                {/* Hạn thanh toán */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Hạn thanh toán <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.due_date && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.due_date[0]}</p>
                  )}
                </div>

                {/* Kỳ thanh toán (nếu là rent) */}
                {formData.type === 'rent' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Kỳ thu từ ngày
                    </label>
                    <input
                      type="date"
                      value={formData.billing_period_start}
                      onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* BẢNG HẠNG MỤC ĐỘNG */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Danh sách hạng mục chi tiết <span className="text-rose-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Tên hạng mục..."
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        className="flex-2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Đơn giá"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-right"
                      />
                      <span className="w-28 font-bold text-right text-slate-800">
                        {formatVND((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* TỔNG TIỀN TÍNH REALTIME */}
                <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center justify-between text-sm">
                  <span className="font-semibold text-blue-950">Tổng số tiền phải thu (tự tính):</span>
                  <span className="text-lg font-extrabold text-blue-700">
                    {formatVND(calculateTotalAmount())}
                  </span>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ghi chú hóa đơn
                </label>
                <textarea
                  rows="2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú thêm cho người thuê nếu cần..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
                >
                  {submitting ? 'Đang lưu...' : editingInvoice ? 'Lưu cập nhật' : 'Xác nhận lập hóa đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HỦY HÓA ĐƠN */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-rose-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Xác nhận hủy hóa đơn
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Bạn có chắc chắn muốn hủy hóa đơn <strong className="text-slate-900">{cancelModalInvoice.invoice_no}</strong>?
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Lý do hủy hóa đơn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy hóa đơn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelModalInvoice(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl"
                >
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GỬI EMAIL */}
      {emailModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" /> Gửi hóa đơn qua email
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Hóa đơn <strong className="text-slate-900">{emailModalInvoice.invoice_no}</strong> (kèm PDF) sẽ được gửi đến email khách hàng.
            </p>
            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Địa chỉ email người nhận
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="khachhang@gmail.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {emailResult.error && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {emailResult.error}
                </p>
              )}
              {emailResult.success && (
                <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  {emailResult.success}
                </p>
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmailModalInvoice(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center gap-1.5"
                >
                  {sendingEmail ? 'Đang gửi...' : 'Gửi ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
