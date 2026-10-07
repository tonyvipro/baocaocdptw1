import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Phone, Calendar, Clock, MapPin, Building2 } from 'lucide-react';

export default function ContactModal({ property, onClose, currentUser, onOpenAuth }) {
  const [selectedDate, setSelectedDate] = useState('Thứ Hai, 16/10/2026');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const timeSlots = [
    { day: 'Thứ Hai, 16/10/2026', times: ['09:00', '11:00', '14:00', '16:00', '17:00'] },
    { day: 'Thứ Ba, 17/10/2026', times: ['10:00', '14:00', '15:00', '16:30'] },
    { day: 'Thứ Tư, 18/10/2026', times: ['09:00', '11:00', '14:30', '16:00'] },
  ];

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Yêu Cầu Đăng Nhập</h3>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            Vui lòng đăng nhập tài khoản để đặt lịch hẹn xem nhà trực tiếp với chuyên viên tư vấn.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Đăng Ký Tài Khoản Mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBooking = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (selectedTime === '14:00' && selectedDate === 'Thứ Hai, 16/10/2026') {
      setErrorMsg('Môi giới đã có lịch hẹn trong khung giờ này. Vui lòng chọn khung giờ khác!');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="bg-slate-900 px-5 py-4 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider">ĐẶT LỊCH HẸN XEM NHÀ</h3>
              <p className="text-slate-400 text-xs mt-0.5 truncate">
                {property ? property.title : 'Bất động sản cao cấp 3TV Land'}
              </p>
            </div>

            <form onSubmit={handleBooking} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Chọn ngày và giờ phù hợp:
                </label>
                
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {timeSlots.map((slot) => (
                    <div key={slot.day} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
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
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
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

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block mb-0.5">Thông tin khách hàng:</span>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Họ tên: {currentUser.name}</span>
                  <span className="text-red-600">SĐT: {currentUser.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú cho môi giới:
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Yêu cầu xem thêm vị trí gửi xe, ban công..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Xác Nhận Đặt Lịch Xem Nhà
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Đặt Lịch Hẹn Thành Công
            </h3>
            <p className="text-xs text-slate-600 -mt-2">
              Chuyên viên tư vấn sẽ liên hệ lại với bạn trong vòng 15 phút để xác nhận.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-left text-xs space-y-1.5">
              <p className="text-slate-700"><strong>Khách hàng:</strong> {currentUser.name} ({currentUser.phone || 'Chưa có SĐT'})</p>
              <p className="text-slate-700"><strong>Thời gian:</strong> <span className="text-red-600 font-bold">{selectedDate} lúc {selectedTime}</span></p>
              <p className="text-slate-700 truncate"><strong>Địa điểm:</strong> {property?.address || property?.project || 'Khu phức hợp'}</p>
              {note && <p className="text-slate-500 italic"><strong>Ghi chú:</strong> {note}</p>}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Hoàn Tất
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
