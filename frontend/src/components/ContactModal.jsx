import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, Phone, Calendar, Clock, MapPin, Building2, Loader2 } from 'lucide-react';

export default function ContactModal({ property, properties = [], onClose, currentUser, onOpenAuth }) {
  // Mặc định chọn ngày mai để luôn cách thời điểm hiện tại > 2 giờ theo đúng đặc tả
  const defaultTomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const minDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState(() => {
    if (property?.id) return String(property.id);
    if (properties.length > 0) return String(properties[0].id);
    return '';
  });

  const activeProperty = useMemo(() => {
    if (property) return property;
    return properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  }, [property, properties, selectedPropertyId]);

  const [selectedDate, setSelectedDate] = useState(defaultTomorrow);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [phone, setPhone] = useState(currentUser?.phone || '0901234567');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const availableTimes = ['08:30', '09:00', '10:00', '11:00', '14:00', '15:30', '16:30', '18:00'];

  if (!currentUser) {
    return (
      <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
        <div className="form-surface relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-slate-200">
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

  const handleBooking = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeProperty?.id) {
      setErrorMsg('Vui lòng chọn bất động sản muốn đặt lịch xem.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMsg('Vui lòng chọn ngày và giờ hẹn xem nhà.');
      return;
    }

    if (note.length > 250) {
      setErrorMsg('Ghi chú không được vượt quá 250 ký tự.');
      return;
    }

    const appointmentTime = `${selectedDate} ${selectedTime}:00`;
    const brokerId = activeProperty.user_id || activeProperty.user?.id || 1;
    const token = localStorage.getItem('3tv_token');

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          property_id: Number(activeProperty.id),
          broker_id: Number(brokerId),
          appointment_time: appointmentTime,
          phone: phone.trim(),
          note: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        const firstFieldErr = data.errors ? Object.values(data.errors).flat()[0] : null;
        setErrorMsg(firstFieldErr || data.message || 'Không thể đặt lịch hẹn. Vui lòng kiểm tra lại thông tin.');
        return;
      }

      setCreatedAppointment(data.data || null);
      setSubmitted(true);
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div
        className="form-surface relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
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
                {activeProperty ? `${activeProperty.code ? `[${activeProperty.code}] ` : ''}${activeProperty.title}` : 'Chọn bất động sản bên dưới để đặt lịch'}
              </p>
            </div>

            <form onSubmit={handleBooking} className="p-5 space-y-4">
              {!property && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Bất động sản muốn xem <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code || `BĐS #${p.id}`}] {p.title} ({p.district || p.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Ngày hẹn xem nhà <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      min={minDateStr}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Giờ hẹn (08:00 - 20:00) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => {
                        setSelectedTime(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  Chọn nhanh khung giờ làm việc:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableTimes.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTime(t);
                          setErrorMsg(null);
                        }}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Khách hàng đặt lịch:</span>
                  <p className="font-bold text-slate-800">{currentUser.name}</p>
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="VD: 0901234567"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Ghi chú cho môi giới:
                  </label>
                  <span className={`text-[11px] font-bold ${note.length > 250 ? 'text-red-600' : 'text-slate-400'}`}>
                    {note.length}/250 ký tự
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNote(val);
                    if (val.length > 250) {
                      setErrorMsg('Ghi chú không được vượt quá 250 ký tự.');
                    } else if (errorMsg === 'Ghi chú không được vượt quá 250 ký tự.') {
                      setErrorMsg(null);
                    }
                  }}
                  placeholder="Yêu cầu xem thêm vị trí gửi xe, ban công... (Tối đa 250 ký tự)"
                  className={`w-full p-2.5 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-1 resize-none ${
                    note.length > 250
                      ? 'border-red-400 focus:ring-red-600'
                      : 'border-slate-300 focus:ring-red-600'
                  }`}
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
                disabled={submitting}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Đang gửi yêu cầu...' : 'Xác Nhận Đặt Lịch Xem Nhà'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Đặt Lịch Hẹn Thành Công!
            </h3>
            <p className="text-xs text-slate-600 -mt-2">
              Yêu cầu đặt lịch hẹn #{createdAppointment?.id} đã được ghi nhận vào hệ thống (Trạng thái: Chờ xác nhận).
            </p>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-left text-xs space-y-1.5 overflow-hidden">
              <p className="text-slate-700 break-words"><strong>Khách hàng:</strong> {currentUser.name} ({phone})</p>
              <p className="text-slate-700 break-words"><strong>Bất động sản:</strong> {activeProperty?.title}</p>
              <p className="text-slate-700"><strong>Thời gian hẹn:</strong> <span className="text-red-600 font-bold">{selectedDate} lúc {selectedTime}</span></p>
              <p className="text-slate-700 truncate"><strong>Địa điểm:</strong> {activeProperty?.address || activeProperty?.district || activeProperty?.project || 'Khu phức hợp'}</p>
              {note && (
                <p className="text-slate-500 italic break-all whitespace-pre-wrap">
                  <strong>Ghi chú:</strong> {note}
                </p>
              )}
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
