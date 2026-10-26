import React, { useState, useEffect } from 'react';
import {
  FileText, ArrowLeft, Download, Mail, Edit3, XCircle,
  Building2, User, Phone, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, AlertTriangle, ShieldAlert,
  CreditCard, RefreshCw, Send, DollarSign, ChevronRight
} from 'lucide-react';
import invoiceApi from '../../services/invoiceApi';

export default function InvoiceDetailPage({ invoiceId: propInvoiceId, onBack }) {
  const getInvoiceId = () => {
    if (propInvoiceId) return propInvoiceId;
    const hash = window.location.hash || '';
    const match = hash.match(/#admin\/invoices\/(\d+)/);
    return match ? Number(match[1]) : null;
  };
  const id = getInvoiceId();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '#admin/invoices';
    }
  };

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States cho modal gửi email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(null);
  const [emailError, setEmailError] = useState(null);

  // States cho modal hủy hóa đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // State tải PDF
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoiceApi.fetchInvoiceDetail(id);
      setInvoice(res.data);
      if (res.data?.customer?.email) {
        setEmailInput(res.data.customer.email);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải chi tiết hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      await invoiceApi.downloadPdf(invoice.id, invoice.invoice_no);
    } catch (err) {
      alert('Lỗi khi tải file PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    try {
      setSendingEmail(true);
      setEmailError(null);
      setEmailSuccess(null);
      const res = await invoiceApi.sendEmail(invoice.id, emailInput.trim());
      setEmailSuccess(res.message || 'Đã gửi hóa đơn thanh toán đến email của khách hàng!');
      // Cập nhật lại email_sent_at trong state
      setInvoice((prev) => ({
        ...prev,
        email_sent_at: res.data?.email_sent_at || new Date().toISOString(),
      }));
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(null);
      }, 1800);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Không thể gửi email hóa đơn.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelInvoice = async (e) => {
    e.preventDefault();
    if (!invoice || !cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy hóa đơn.');
      return;
    }
    try {
      setCancelling(true);
      setCancelError(null);
      const res = await invoiceApi.cancelInvoice(invoice.id, cancelReason.trim(), invoice.version);
      setInvoice(res.data);
      setShowCancelModal(false);
      setCancelReason('');
      alert('Đã hủy hóa đơn thành công!');
    } catch (err) {
      if (err.response?.status === 409) {
        setCancelError('Hóa đơn đã bị cập nhật bởi người dùng khác. Vui lòng tải lại trang.');
      } else {
        setCancelError(err.response?.data?.message || 'Không thể hủy hóa đơn.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (Number(status)) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chưa thanh toán
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Quá hạn thanh toán
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hóa đơn</h2>
        <p className="text-slate-600 mb-6">{error || 'Hóa đơn không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const canEditOrCancel = (invoice.status === 0 || invoice.status === 2) && (!invoice.transactions || invoice.transactions.length === 0) && invoice.paid_amount === 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Thanh điều hướng breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={handleBack}
            className="hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Quản lý hóa đơn
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-800">{invoice.invoice_no}</span>
        </div>

        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* KHUNG HÓA ĐƠN CHUẨN HÌNH 46 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* HEADER HÓA ĐƠN */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  {invoice.type_label}
                </span>
                <span className="text-xs text-slate-400">
                  Ngày lập: {formatDate(invoice.issue_date)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {invoice.invoice_no}
              </h1>
              <p className="text-slate-300 text-sm mt-1">{invoice.title}</p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div>{getStatusBadge(invoice.status)}</div>
              <div className="text-xs text-slate-300">
                Hạn thanh toán:{' '}
                <strong className={Number(invoice.status) === 2 ? 'text-rose-400 font-bold' : 'text-white'}>
                  {formatDate(invoice.due_date)}
                </strong>
              </div>
              {invoice.email_sent_at && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Đã gửi email lúc {formatDate(invoice.email_sent_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* THÔNG TIN KHÁCH HÀNG & CĂN HỘ (Hình 46) */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" /> Thông tin khách hàng & Bất động sản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột 1: Người thuê */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                {invoice.customer?.name || 'Khách hàng chưa định danh'}
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-medium text-slate-800">{invoice.customer?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800">{invoice.customer?.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Hợp đồng:</span>
                <span className="font-semibold text-blue-600">
                  {invoice.contract?.contract_code} ({invoice.contract?.contract_name})
                </span>
              </div>
            </div>

            {/* Cột 2: Căn hộ */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Căn hộ: {invoice.property?.code || ('P' + invoice.property?.id)}
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Tên BĐS:</span>
                <span className="font-medium text-slate-800">{invoice.property?.title}</span>
              </div>
              <div className="text-slate-600">
                <span className="text-slate-400 block mb-0.5">Địa chỉ chi tiết:</span>
                <span className="font-medium text-slate-800 flex items-start gap-1">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  {invoice.property?.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG HẠNG MỤC THANH TOÁN (Hình 46) */}
        <div className="p-6 sm:p-8 border-b border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" /> Bảng hạng mục chi tiết
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Hạng mục</th>
                  <th className="py-3 px-4">Mô tả khối lượng / đơn giá</th>
                  <th className="py-3 px-4 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{item.item_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.description || `${Number(item.quantity)} x ${formatVND(item.unit_price)}`}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatVND(item.total_price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                      Chưa có hạng mục chi tiết nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TỔNG CỘNG THANH TOÁN & THÔNG TIN CHUYỂN KHOẢN (Hình 46) */}
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Box thông tin chuyển khoản ngân hàng */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-blue-700">
                <CreditCard className="w-4 h-4" /> Thông tin tài khoản nhận thanh toán:
              </div>
              <p>Ngân hàng: <strong>Vietcombank (VCB)</strong></p>
              <p>Số tài khoản: <strong className="text-slate-900 font-mono text-sm">9999 8888 6666</strong></p>
              <p>Chủ tài khoản: <strong>CONG TY BĐS 3TVLAND</strong></p>
              <p>Nội dung chuyển khoản: <strong className="text-blue-600 font-mono">{invoice.invoice_no}</strong></p>
            </div>

            {/* Box tổng tiền thanh toán */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>Tổng số tiền:</span>
                <span className="text-lg font-bold text-slate-900">{formatVND(invoice.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>Đã thanh toán:</span>
                <span className="font-semibold text-emerald-600">{formatVND(invoice.paid_amount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Còn nợ:</span>
                <span className="text-xl font-extrabold text-rose-600">{formatVND(invoice.remaining)}</span>
              </div>
            </div>
          </div>

          {/* Ghi chú hoặc lý do hủy */}
          {invoice.note && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-sm">
              <strong className="block font-semibold mb-1">Ghi chú:</strong>
              {invoice.note}
            </div>
          )}

          {invoice.status === 3 && invoice.cancel_reason && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <strong className="block font-semibold mb-1 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Lý do hủy hóa đơn:
              </strong>
              {invoice.cancel_reason}
            </div>
          )}

          {/* Lịch sử giao dịch thanh toán nếu có */}
          {invoice.transactions && invoice.transactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Lịch sử giao dịch thanh toán ({invoice.transactions.length})
              </h3>
              <div className="space-y-2">
                {invoice.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-medium text-slate-800">{tx.payment_method_label}</span>
                      <span className="text-xs text-slate-400">({formatDate(tx.paid_at)})</span>
                    </div>
                    <span className="font-bold text-emerald-600">+{formatVND(tx.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Thông tin kiểm toán & phiên bản */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              Lập bởi: <strong className="text-slate-700">{invoice.creator?.name || 'Hệ thống'}</strong>
              {invoice.updater && (
                <> • Cập nhật lần cuối bởi: <strong className="text-slate-700">{invoice.updater.name}</strong></>
              )}
            </span>
            <span className="font-mono text-slate-400">
              Phiên bản: v{invoice.version || 1}
            </span>
          </div>
        </div>

        {/* FOOTER NÚT THAO TÁC (Hình 46) */}
        <div className="p-6 bg-slate-100/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            Quay lại danh sách
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút Hủy hóa đơn */}
            {canEditOrCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 font-medium rounded-xl border border-rose-200 transition-colors shadow-2xs"
              >
                <XCircle className="w-4 h-4" /> Hủy hóa đơn
              </button>
            )}

            {/* Nút Gửi Email */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4" /> Gửi Email
            </button>

            {/* Nút Tải PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              <Download className={`w-4 h-4 ${downloadingPdf ? 'animate-bounce' : ''}`} />
              {downloadingPdf ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GỬI EMAIL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" /> Gửi hóa đơn qua email
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống sẽ gửi hóa đơn kèm file PDF đính kèm tới địa chỉ này.
                </p>
              </div>

              {emailError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {emailSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingEmail}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Xác nhận gửi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HỦY HÓA ĐƠN */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Xác nhận hủy hóa đơn
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelInvoice} className="space-y-4">
              <p className="text-sm text-slate-600">
                Hóa đơn <strong className="text-slate-900">{invoice.invoice_no}</strong> sẽ bị hủy và chuyển sang trạng thái cuối cùng. Hành động này không thể hoàn tác.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Lý do hủy hóa đơn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do hủy hóa đơn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-sm"
                ></textarea>
              </div>

              {cancelError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cancelError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang hủy...
                    </>
                  ) : (
                    'Xác nhận hủy hóa đơn'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
