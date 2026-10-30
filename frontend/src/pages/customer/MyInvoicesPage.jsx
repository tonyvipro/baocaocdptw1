import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, RefreshCw, Eye, Download, Calendar,
  Building2, ArrowRight, ArrowLeft, ShieldCheck, AlertTriangle, Clock,
  Filter, X, ChevronLeft, ChevronRight, CheckCircle2, User, Phone,
  CreditCard, MapPin, DollarSign, Home, AlertCircle
} from 'lucide-react';
import invoiceApi from '../../services/invoiceApi';
import PaymentRecordModal from '../../components/PaymentRecordModal';
import QrPaymentModal from '../../components/QrPaymentModal';

export default function MyInvoicesPage({ currentUser, onGoHome }) {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modal chi tiết hóa đơn khách hàng (Hình 46)
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Modal Thanh toán QR (Phân hệ 9)
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [activeQrData, setActiveQrData] = useState(null);

  const fetchMyInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoiceApi.fetchMyInvoices({
        page,
        status: statusFilter !== '' ? statusFilter : undefined,
      });
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
  }, [statusFilter]);

  useEffect(() => {
    fetchMyInvoices(1);
  }, [fetchMyInvoices]);

  const handleOpenDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await invoiceApi.fetchMyInvoiceDetail(id);
      setDetailInvoice(res.data);
    } catch (err) {
      alert('Không thể tải chi tiết hóa đơn: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadPdf = async (inv) => {
    try {
      setDownloadingPdf(true);
      await invoiceApi.downloadMyPdf(inv.id, inv.invoice_no);
    } catch (err) {
      alert('Lỗi tải file PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              onClick={onGoHome || (() => (window.location.href = '/'))}
              className="hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <Home className="w-4 h-4" /> Trang chủ
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">Hóa đơn của tôi</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role_id === 1 && (
              <button
                onClick={() => {
                  localStorage.setItem('3tv_app_mode', 'admin');
                  localStorage.setItem('3tv_admin_active_menu', 'invoices');
                  window.location.hash = '#admin/invoices';
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 font-bold transition-colors cursor-pointer"
                title="Quay lại giao diện Quản lý Hóa đơn dành cho Quản trị viên"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Về Quản lý Admin
              </button>
            )}

            <button
              onClick={() => fetchMyInvoices(pagination.currentPage)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>
        </div>

        {currentUser?.role_id === 1 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Chế độ Quản trị viên (Admin Preview): Bạn đang xem danh sách hóa đơn theo đúng góc nhìn của khách hàng để kiểm tra tính năng.
            </span>
          </div>
        )}

        {/* Tiêu đề & Giới thiệu */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Cổng thông tin cư dân & khách hàng
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2.5 tracking-tight">
              Hóa đơn & Lịch sử thanh toán của tôi
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Theo dõi chi tiết các khoản thanh toán tiền thuê nhà, phí dịch vụ tiện ích, lịch sử giao dịch và tải hóa đơn điện tử PDF.
            </p>
          </div>
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Trạng thái:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Tất cả', val: '' },
                { label: 'Chưa thanh toán', val: '0' },
                { label: 'Đã thanh toán', val: '1' },
                { label: 'Quá hạn', val: '2' },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setStatusFilter(btn.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === btn.val
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-slate-700">{pagination.total}</strong> hóa đơn
          </div>
        </div>

        {/* Danh sách hóa đơn của tôi */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            Đang tải danh sách hóa đơn của bạn...
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700 mb-1">Chưa có hóa đơn nào</h3>
            <p className="text-sm">Hiện tại bạn chưa có hóa đơn nào cần thanh toán hoặc đã thanh toán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {inv.invoice_no}
                    </span>
                    {Number(inv.status) === 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" /> Chưa thanh toán
                      </span>
                    )}
                    {Number(inv.status) === 1 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                      </span>
                    )}
                    {Number(inv.status) === 2 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Quá hạn
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{inv.title}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Căn hộ: <strong>{inv.property_code}</strong> ({inv.property_title})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hạn thanh toán: <strong className={Number(inv.status) === 2 ? 'text-rose-600 font-bold' : 'text-slate-700'}>{formatDate(inv.due_date)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Số tiền:</div>
                    <div className="text-base font-extrabold text-slate-900">{formatVND(inv.amount)}</div>
                    {inv.remaining > 0 && (
                      <div className="text-xs font-bold text-rose-600">Còn nợ: {formatVND(inv.remaining)}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {Number(inv.status) !== 1 && Number(inv.status) !== 3 && (
                      <button
                        onClick={() => setPayingInvoice(inv)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Quét mã QR thanh toán ngay"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Thanh toán
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdf(inv)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200"
                      title="Tải hóa đơn PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang */}
        {pagination.lastPage > 1 && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <div>
              Trang {pagination.currentPage} / {pagination.lastPage}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchMyInvoices(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchMyInvoices(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT HÓA ĐƠN KHÁCH HÀNG (HÌNH 46) */}
      {detailInvoice && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="form-surface bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">
                  {detailInvoice.type_label}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">{detailInvoice.invoice_no}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{detailInvoice.title}</p>
              </div>
              <button
                onClick={() => setDetailInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Khối căn hộ & ngày lập */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-slate-400">Căn hộ / BĐS:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{detailInvoice.property_code}</p>
                <p className="text-slate-500">{detailInvoice.property_address}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-slate-400">Hạn thanh toán:</p>
                <p className="font-bold text-sm text-rose-600 mt-0.5">{formatDate(detailInvoice.due_date)}</p>
                <p className="text-slate-500">Ngày lập: {formatDate(detailInvoice.issue_date)}</p>
              </div>
            </div>

            {/* Bảng hạng mục (Hình 46) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Hạng mục</th>
                    <th className="py-2.5 px-3">Khối lượng / Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.item_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.description || `${item.quantity} x ${formatVND(item.unit_price)}`}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bảng tổng kết thanh toán */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Tổng cộng:</span>
                <span className="font-bold text-sm text-slate-900">{formatVND(detailInvoice.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Đã thanh toán:</span>
                <span className="font-semibold text-emerald-600">{formatVND(detailInvoice.paid_amount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-900">Còn nợ:</span>
                <span className="text-rose-600 font-extrabold">{formatVND(detailInvoice.remaining)}</span>
              </div>
            </div>

            {/* Lịch sử giao dịch / Biến động tiền cọc (nếu có) */}
            {detailInvoice.transactions?.length > 0 && (
              <div className="mb-5 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lịch sử giao dịch ({detailInvoice.transactions.length})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detailInvoice.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-800">{tx.transaction_code}</span>
                        {tx.type_label && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.direction === 'out'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type_label}
                          </span>
                        )}
                        <span className="text-slate-500 text-[11px]">{tx.paid_at_formatted || formatDate(tx.paid_at)}</span>
                        {tx.reason && (
                          <span className="text-[11px] text-amber-800 italic">({tx.reason})</span>
                        )}
                      </div>
                      <span
                        className={`font-bold ${
                          Number(tx.status) === 5
                            ? 'text-slate-400 line-through'
                            : tx.direction === 'out'
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {tx.direction === 'out' ? '-' : '+'}
                        {formatVND(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thông tin chuyển khoản */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1 mb-5">
              <div className="font-bold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Thông tin tài khoản chuyển khoản:
              </div>
              <p>Ngân hàng: <strong>Vietcombank (VCB)</strong> | STK: <strong className="font-mono text-sm">9999 8888 6666</strong></p>
              <p>Chủ TK: <strong>CONG TY BĐS 3TVLAND</strong> | Nội dung CK: <strong className="font-mono text-blue-700">{detailInvoice.invoice_no}</strong></p>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDetailInvoice(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              {Number(detailInvoice.status) !== 1 && Number(detailInvoice.status) !== 3 && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailInvoice;
                    setDetailInvoice(null);
                    setPayingInvoice(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Thanh toán QR
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDownloadPdf(detailInvoice)}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
              >
                <Download className={`w-4 h-4 ${downloadingPdf ? 'animate-bounce' : ''}`} />
                {downloadingPdf ? 'Đang tải PDF...' : 'Tải xuống PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Khởi tạo Thanh toán (Khách hàng dùng tab QR) */}
      {payingInvoice && (
        <PaymentRecordModal
          isOpen={Boolean(payingInvoice)}
          onClose={() => setPayingInvoice(null)}
          initialInvoice={payingInvoice}
          allowManual={currentUser?.role_id === 1 || currentUser?.role_id === 2}
          onSuccessRecord={() => {
            setPayingInvoice(null);
            fetchMyInvoices(pagination.currentPage);
          }}
          onOpenQrGenerated={(qrData, inv) => {
            setActiveQrData({ qrData, invoice: inv });
          }}
        />
      )}

      {/* Modal Hiển thị mã QR và Polling trạng thái */}
      {activeQrData && (
        <QrPaymentModal
          isOpen={Boolean(activeQrData)}
          onClose={(wasSuccess) => {
            setActiveQrData(null);
            // Chỉ khi người dùng bấm đóng form sau khi thanh toán thành công thì mới reload
            if (wasSuccess) {
              window.location.reload();
            }
          }}
          qrData={activeQrData.qrData}
          invoice={activeQrData.invoice}
        />
      )}
    </div>
  );
}
