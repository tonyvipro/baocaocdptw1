import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, QrCode, Copy, Check, Clock, AlertTriangle, CheckCircle2,
  ExternalLink, RotateCcw, AlertCircle, ShieldCheck, Building2, User
} from 'lucide-react';
import paymentApi from '../services/paymentApi';

export default function QrPaymentModal({
  isOpen,
  onClose,
  qrData, // { transaction, transaction_code, gateway_order_id, qr_content, pay_url, amount, gateway, expires_at }
  invoice,
  onSuccess,
  onSuccessPayment,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'failed' | 'expired' | 'cancelled'
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút (giây)
  const [isCancelling, setIsCancelling] = useState(false);
  const [pollIntervalMs, setPollIntervalMs] = useState(3000);

  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const handleClose = () => {
    const isSuccess = status === 'success';
    if (typeof onClose === 'function') {
      onClose(isSuccess);
    }
  };

  // Tính thời gian đếm ngược dựa trên expires_at
  useEffect(() => {
    if (!isOpen || !qrData?.expires_at) return;

    const expireTime = new Date(qrData.expires_at).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((expireTime - now) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0 && status === 'pending') {
        setStatus('expired');
        setErrorMessage('Giao dịch thanh toán đã hết hạn. Vui lòng tạo mã mới.');
      }
    };

    updateCountdown();
    countdownTimerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, qrData, status]);

  // Polling hỏi trạng thái đơn từ server (3s -> giãn dần tới 10s)
  const pollStatus = useCallback(async () => {
    if (!qrData?.transaction_code || status !== 'pending') return;

    try {
      const res = await paymentApi.pollTransactionStatus(qrData.transaction_code);
      const tx = res.data;

      if (tx.status === 1) { // THÀNH CÔNG
        setStatus('success');
      } else if (tx.status === 2) { // THẤT BẠI
        setStatus('failed');
        setErrorMessage(tx.failure_reason || 'Giao dịch thanh toán không thành công.');
      } else if (tx.status === 4) { // HẾT HẠN
        setStatus('expired');
        setErrorMessage('Giao dịch thanh toán đã hết hạn.');
      } else if (tx.status === 5) { // ĐÃ HỦY
        setStatus('cancelled');
        setErrorMessage('Giao dịch thanh toán đã bị hủy.');
      } else if (tx.status === 6) { // CẦN ĐỐI SOÁT
        setStatus('failed');
        setErrorMessage('Giao dịch có sai lệch số tiền, đang chờ đối soát thủ công từ Quản trị viên.');
      }
    } catch (err) {
      console.warn('Lỗi polling trạng thái thanh toán:', err);
    }
  }, [qrData, status, onSuccess]);

  useEffect(() => {
    if (!isOpen || status !== 'pending') {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      return;
    }

    const scheduleNextPoll = () => {
      pollTimerRef.current = setTimeout(async () => {
        await pollStatus();
        // Giãn dần tần suất polling từ 3s -> 5s -> tối đa 8s
        setPollIntervalMs((prev) => Math.min(prev + 1000, 8000));
      }, pollIntervalMs);
    };

    scheduleNextPoll();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isOpen, status, pollIntervalMs, pollStatus]);

  if (!isOpen || !qrData) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCancelPayment = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy giao dịch thanh toán QR này?')) return;
    try {
      setIsCancelling(true);
      await paymentApi.cancelQrPayment(qrData.transaction_code);
      setStatus('cancelled');
      setErrorMessage('Đã hủy giao dịch thanh toán.');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy giao dịch lúc này.');
    } finally {
      setIsCancelling(false);
    }
  };

  const transferContent = qrData.transaction_code || qrData.gateway_order_id;
  const isMock = qrData.gateway === 'mock';
  const qrValue = qrData.qr_content || qrData.pay_url || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Quét mã QR thanh toán</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Cổng: <span className="font-medium uppercase">{qrData.gateway === 'sepay' ? 'VietQR (SePay)' : qrData.gateway}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* MÀN HÌNH THÀNH CÔNG */}
          {status === 'success' && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Thanh toán thành công!</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Hóa đơn <span className="font-semibold text-slate-900">{invoice?.invoice_no}</span> đã được cập nhật Đã thanh toán.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Mã giao dịch:</span>
                  <span className="font-mono font-bold">{qrData.transaction_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Số tiền:</span>
                  <span className="font-bold">{formatCurrency(qrData.amount)}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-md"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}

          {/* MÀN HÌNH THẤT BẠI / HẾT HẠN / ĐÃ HỦY */}
          {status !== 'pending' && status !== 'success' && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-800 text-sm">
                    {status === 'expired' ? 'Giao dịch đã hết hạn' : status === 'cancelled' ? 'Giao dịch đã bị hủy' : 'Thanh toán không thành công'}
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    {errorMessage || 'Vui lòng kiểm tra lại tài khoản hoặc tạo mã thanh toán mới.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* MÀN HÌNH CHỜ THANH TOÁN (PENDING) */}
          {status === 'pending' && (
            <>
              {/* Đếm ngược thời gian */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Vui lòng quét mã và chuyển khoản trong:</span>
                </div>
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md text-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Khối hiển thị mã QR */}
              <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                  {qrValue.startsWith('https://qr.sepay.vn') ? (
                    <img
                      src={qrValue}
                      alt="VietQR SePay"
                      className="w-56 h-56 object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback sang render QR SVG nếu ảnh mạng gặp trục trặc
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <QRCodeSVG
                      value={qrValue}
                      size={220}
                      level="M"
                      includeMargin={true}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2.5 text-center flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mở app ngân hàng (VietQR Napas) hoặc ví điện tử để quét mã</span>
                </p>
              </div>

              {/* Thông tin số tiền & chuyển khoản */}
              <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Số tiền thanh toán:</span>
                  <span className="font-bold text-base text-emerald-700">
                    {formatCurrency(qrData.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Nội dung chuyển khoản (bắt buộc):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, 'content')}
                      className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-white transition-colors"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mã hóa đơn:</span>
                  <span className="font-medium text-slate-800">{invoice?.invoice_no}</span>
                </div>
              </div>

              {/* Nút dành riêng cho MockGateway (Giả lập kiểm thử) */}
              {isMock && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Môi trường MockGateway (Giả lập kiểm thử localhost)</span>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Bạn có thể mô phỏng quét mã thành công hoặc thất bại ngay tại đây:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await paymentApi.submitMockPaymentAction(qrData.transaction_code, 'success');
                        await pollStatus();
                      }}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
                    >
                      Giả lập Thành công
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await paymentApi.submitMockPaymentAction(qrData.transaction_code, 'failed');
                        await pollStatus();
                      }}
                      className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
                    >
                      Giả lập Thất bại
                    </button>
                  </div>
                </div>
              )}

              {/* Trạng thái đang lắng nghe Webhook */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Hệ thống đang tự động lắng nghe xác nhận từ ngân hàng...</span>
              </div>

              {/* Nút thao tác dưới cùng */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={isCancelling}
                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Đang hủy...' : 'Hủy giao dịch này'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Đóng modal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
