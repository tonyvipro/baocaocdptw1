import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertCircle, CheckCircle2, Clock, RotateCcw,
  Building, User, FileText, ArrowLeft, RefreshCw
} from 'lucide-react';
import paymentApi from '../services/paymentApi';

export default function MockGatewayPayPage({ onGoBack }) {
  const [transactionCode, setTransactionCode] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [resultType, setResultType] = useState('info'); // 'success' | 'error' | 'info'

  useEffect(() => {
    // Trích xuất mã giao dịch từ URL (VD: /mock-gateway/pay/TXN-...)
    const pathParts = window.location.pathname.split('/');
    const code = pathParts[pathParts.length - 1];
    setTransactionCode(code);

    if (code) {
      loadInfo(code);
    } else {
      setLoading(false);
      setResultMessage('Không tìm thấy mã giao dịch trong đường dẫn.');
      setResultType('error');
    }
  }, []);

  const loadInfo = async (code) => {
    try {
      setLoading(true);
      const res = await paymentApi.fetchMockPaymentInfo(code);
      setPaymentInfo(res.data);
    } catch (err) {
      setResultMessage(err.response?.data?.message || 'Không thể tải thông tin giao dịch giả lập.');
      setResultType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setResultMessage(null);
      const res = await paymentApi.submitMockPaymentAction(transactionCode, action);
      setResultMessage(`Đã mô phỏng hành động '${action}' thành công! Cổng đã gửi Webhook IPN về server.`);
      setResultType(action === 'success' ? 'success' : 'info');
      // Tải lại thông tin
      await loadInfo(transactionCode);
    } catch (err) {
      setResultMessage(err.response?.data?.message || 'Lỗi khi gửi hành động giả lập.');
      setResultType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header App Giả lập */}
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6 text-white text-center space-y-1">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2 backdrop-blur-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-lg font-bold">3TV Land Mock Gateway</h2>
          <p className="text-xs text-indigo-100">Cổng thanh toán giả lập dành cho môi trường Localhost & Dev</p>
        </div>

        {/* Nội dung đơn hàng */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs">Đang tải thông tin đơn hàng...</p>
            </div>
          ) : paymentInfo ? (
            <>
              {/* Thông báo kết quả */}
              {resultMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    resultType === 'success'
                      ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                      : resultType === 'error'
                      ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                      : 'bg-indigo-950/60 border-indigo-700/80 text-indigo-200'
                  }`}
                >
                  {resultType === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{resultMessage}</span>
                </div>
              )}

              {/* Chi tiết đơn */}
              <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-700/60 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Số tiền thanh toán:</span>
                  <span className="font-bold text-lg text-emerald-400">
                    {formatCurrency(paymentInfo.amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Mã giao dịch:</span>
                  <span className="font-mono font-semibold text-slate-200">{paymentInfo.transaction_code}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Số hóa đơn:</span>
                  <span className="font-semibold text-slate-200">{paymentInfo.invoice_no}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Bất động sản:</span>
                  <span className="text-slate-200 text-right truncate max-w-[200px]">
                    {paymentInfo.property_title || 'Căn hộ'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Trạng thái hiện tại:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      paymentInfo.status === 1
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        : paymentInfo.status === 0
                        ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                        : 'bg-rose-900/80 text-rose-300 border border-rose-700'
                    }`}
                  >
                    {paymentInfo.status_label}
                  </span>
                </div>
              </div>

              {/* 3 Nút mô phỏng hành động */}
              {paymentInfo.status === 0 ? (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs text-slate-400 text-center font-medium">
                    Chọn hành động khách hàng quét mã và thanh toán:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAction('success')}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Xác nhận Thanh toán Thành công</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('failed')}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 bg-rose-600/80 hover:bg-rose-600 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Mô phỏng Thanh toán Thất bại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ giao dịch
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-400">
                    Đơn hàng này đã kết thúc với trạng thái <span className="font-bold text-white">{paymentInfo.status_label}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onGoBack) onGoBack();
                      else window.location.href = '/payments';
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Quay về trang Quản lý Thanh toán
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-rose-400 text-xs">
              {resultMessage || 'Không tìm thấy dữ liệu giao dịch.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-700/60 text-center text-[11px] text-slate-500">
          Chế độ sandbox chỉ kích hoạt khi APP_ENV=local hoặc PAYMENT_GATEWAY=mock.
        </div>
      </div>
    </div>
  );
}
