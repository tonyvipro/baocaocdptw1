import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Phone, Calendar, User, Clock, MapPin, Sparkles, AlertCircle, PlusCircle, Home } from 'lucide-react';

export default function ContactModal({ property, onClose, currentUser, onOpenAuth }) {
  const [selectedDate, setSelectedDate] = useState('Thứ Hai, 16/10/2026');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Khung giờ theo Spec Hình 33
  const timeSlots = [
    { day: 'Thứ Hai, 16/10/2026', times: ['09:00', '11:00', '14:00', '16:00', '17:00'] },
    { day: 'Thứ Ba, 17/10/2026', times: ['10:00', '14:00', '15:00', '16:30'] },
    { day: 'Thứ Tư, 18/10/2026', times: ['09:00', '11:00', '14:30', '16:00'] },
  ];

  // Kiểm tra điều kiện bắt buộc Đăng nhập theo Spec (Trang 62 & 72)
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 text-center border border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Yêu Cầu Đăng Nhập</h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Theo quy định hệ thống, bạn cần đăng nhập tài khoản trước khi thực hiện đặt lịch hẹn xem nhà trực tiếp với môi giới.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition-all"
            >
              Tạo Tài Khoản Mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBooking = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Kiểm tra Double booking theo Business Rules trang 22
    // Nếu chọn 14:00 ngày Thứ Hai mà đã có lịch sẽ cảnh báo mô phỏng
    if (selectedTime === '14:00' && selectedDate === 'Thứ Hai, 16/10/2026') {
      setErrorMsg('Môi giới đã có lịch hẹn trong khung giờ này. Vui lòng chọn thời gian khác!');
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          /* ================= HÌNH 33: ĐẶT LỊCH XEM NHÀ ================= */
          <div>
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 px-6 py-5 text-white">
              <h3 className="text-lg font-black uppercase tracking-wider">ĐẶT LỊCH XEM NHÀ</h3>
              <p className="text-slate-300 text-xs mt-0.5 truncate">
                {property ? property.title : 'Bất động sản cao cấp 3TV Land'}
              </p>
            </div>

            <form onSubmit={handleBooking} className="p-6 space-y-4">
              
              {/* Chọn ngày và giờ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Chọn ngày và giờ xem nhà:
                </label>
                
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {timeSlots.map((slot) => (
                    <div key={slot.day} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-800 mb-1.5">{slot.day}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {slot.times.map((t) => {
                          const isSelected = selectedDate === slot.day && selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setSelectedDate(slot.day);
                                setSelectedTime(t);
                                setErrorMsg(null);
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin người đặt (Tự động điền theo Spec) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Thông tin người đặt (Tự động trích xuất):
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Họ & Tên: {currentUser.name}</span>
                  <span className="text-emerald-700">SĐT: {currentUser.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              {/* Ghi chú bổ sung */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú bổ sung:
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho môi giới hoặc thời gian thương lượng thêm..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nút hành động */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99]"
              >
                XÁC NHẬN ĐẶT LỊCH
              </button>
            </form>
          </div>
        ) : (
          /* ================= HÌNH 34: XÁC NHẬN LỊCH HẸN ================= */
          <div className="p-7 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-lg font-black text-slate-900 uppercase">
              Xác Nhận Lịch Hẹn
            </h3>
            <p className="text-xs text-emerald-700 font-bold -mt-2">
              Lịch hẹn của bạn đã được xác nhận thành công.
            </p>

            {/* Chi tiết thông tin xác nhận */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div>
                <span className="text-slate-500 font-semibold block">Thông tin khách hàng:</span>
                <p className="font-bold text-slate-800">Tên: {currentUser.name}</p>
                <p className="font-bold text-slate-800">Số điện thoại: {currentUser.phone || '090x xxx xxx'}</p>
              </div>
              <div className="border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 font-semibold block">Chi tiết lịch hẹn:</span>
                <p className="font-bold text-slate-800">Dịch vụ: Xem nhà mẫu / Thực tế BĐS</p>
                <p className="font-bold text-emerald-700">Thời gian: {selectedDate} - {selectedTime}</p>
                <p className="font-bold text-slate-800 truncate">Địa điểm: {property?.address || property?.project || 'Khu phức hợp 3TV Land'}</p>
              </div>
              {note && (
                <div className="border-t border-slate-200/80 pt-2">
                  <span className="text-slate-500 font-semibold block">Ghi chú:</span>
                  <p className="text-slate-700 italic">{note}</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => alert('Đã thêm lịch hẹn vào ứng dụng Google Calendar / iCal của bạn!')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl shadow-md transition-all"
              >
                THÊM VÀO LỊCH
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase rounded-xl transition-all"
              >
                QUAY LẠI TRANG CHỦ
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
