import { useConfirm } from '../forms/ConfirmProvider';
import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, GitMerge, RotateCcw, Save, UserCheck, Users } from 'lucide-react';
import { checkCustomerDuplicates, customerRequest, mergeCustomers, normalizeCrmPhone } from '../../services/customers';
import CrmDialog, { crmInput, crmButton, CrmError, CrmSelectOptions } from './CrmDialog';

export default function CustomerForm({ customer, options, onClose, onSaved, onSelectExisting, mode = 'management' }) {
  const confirm = useConfirm();
  const isEditing = Boolean(customer?.id);

  const [form, setForm] = useState(() => ({
    name: customer?.name || '',
    company: customer?.company || '',
    source: customer?.source || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    notes: customer?.notes || '',
    customer_group: customer?.customer_group || 'new',
    status: customer?.status || 'new',
    assigned_to: customer?.assigned_to?.id ?? '',
    is_tracked: customer?.is_tracked ?? true,
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  // Duplicate detection & merge state
  const [duplicateResults, setDuplicateResults] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergeReason, setMergeReason] = useState('Trùng thông tin liên hệ khi tạo/cập nhật hồ sơ');

  const change = event => {
    const { name, value, type, checked } = event.target;
    let nextVal = value;
    if (type === 'checkbox') {
      nextVal = checked;
    } else if (name === 'phone') {
      const normalized = normalizeCrmPhone(value);
      nextVal = (normalized || value.replace(/[^0-9]/g, '')).slice(0, 11);
    } else {
      nextVal = value.slice(0, 250);
    }
    setForm(prev => ({
      ...prev,
      [name]: nextVal,
    }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePhoneBlur = () => {
    if (form.phone) {
      const normalized = normalizeCrmPhone(form.phone);
      if (normalized) setForm(prev => ({ ...prev, phone: normalized }));
    }
  };

  const executeSave = async () => {
    setSaving(true);
    setError('');
    setErrors({});
    try {
      const data = {
        ...form,
        phone: normalizeCrmPhone(form.phone) || form.phone,
        email: form.email ? form.email.toLowerCase().trim() : null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        ...(isEditing ? { version: customer.version } : {}),
      };

      let result;
      if (isEditing) {
        result = await customerRequest(`/${customer.id}`, { method: 'PUT', data });
      } else {
        result = await customerRequest('', { method: 'POST', data });
      }

      onSaved(result.message);
    } catch (err) {
      setError(err.message);
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  const handlePreSave = async event => {
    event.preventDefault();
    setError('');
    setErrors({});

    // 1. Kiểm tra trùng thông tin (SĐT, Email, Tên)
    setSaving(true);
    try {
      const dupCheck = await checkCustomerDuplicates({
        name: form.name,
        phone: normalizeCrmPhone(form.phone) || form.phone,
        email: form.email,
        id: customer?.id || null,
      });

      if (dupCheck.has_duplicates && dupCheck.duplicates.length > 0) {
        setDuplicateResults(dupCheck.duplicates);
        setSaving(false);
        return;
      }
    } catch (e) {
      // Nếu kiểm tra trùng bị lỗi mạng, vẫn cho phép tiếp tục lưu
    }
    setSaving(false);

    // 2. Không có trùng hoặc kiểm tra xong -> xác nhận lưu
    const confirmMsg = isEditing
      ? 'Lưu các thay đổi của khách hàng này?'
      : 'Tạo hồ sơ khách hàng mới vào hệ thống?';
    if (!(await confirm({ title: isEditing ? 'Xác nhận cập nhật' : 'Xác nhận tạo mới', message: confirmMsg }))) {
      return;
    }

    await executeSave();
  };

  const handleExecuteMerge = async (existingDup) => {
    if (!(await confirm({
      title: 'Xác nhận gộp hồ sơ',
      message: `Gộp hồ sơ khách hàng ${isEditing ? `"${customer.name}"` : 'mới'} vào hồ sơ sẵn có "${existingDup.name}" (#${existingDup.code})? Toàn bộ nhu cầu, lịch chăm sóc và tương tác sẽ được chuyển sang hồ sơ sẵn có.`,
    }))) {
      return;
    }

    setMerging(true);
    setError('');
    try {
      if (isEditing) {
        // Gộp hồ sơ đang sửa vào hồ sơ sẵn có (hoặc ngược lại)
        const res = await mergeCustomers(existingDup.id, customer.id, mergeReason);
        onSaved(res.message);
      } else {
        // Tạo hồ sơ mới trước rồi gộp ngay vào hồ sơ sẵn có
        const createRes = await customerRequest('', {
          method: 'POST',
          data: {
            ...form,
            phone: normalizeCrmPhone(form.phone) || form.phone,
            email: form.email ? form.email.toLowerCase().trim() : null,
            assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          },
        });
        const newCustomerId = createRes.data?.id;
        if (newCustomerId) {
          const res = await mergeCustomers(existingDup.id, newCustomerId, mergeReason);
          onSaved(`Đã tạo và gộp thành công vào hồ sơ ${existingDup.name} (#${existingDup.code}).`);
        } else {
          onSaved('Đã tạo khách hàng thành công.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
    }
  };

  const field = (name, label, type = 'text', required = false) => (
    <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
      <span>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        className={crmInput}
        name={name}
        type={type}
        required={required}
        maxLength={name === 'phone' ? 11 : 250}
        {...(name === 'phone'
          ? {
              inputMode: 'numeric',
              pattern: '[0-9]{10,11}',
              minLength: 10,
              title: 'Chỉ nhập 10–11 chữ số',
              onBlur: handlePhoneBlur,
            }
          : {})}
        value={form[name]}
        onChange={change}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && <span className="block text-rose-600">{errors[name][0]}</span>}
    </label>
  );

  // MÀN HÌNH CẢNH BÁO TRÙNG LẶP & 3 LỰA CHỌN
  if (duplicateResults) {
    return (
      <CrmDialog title="Phát hiện hồ sơ khách hàng nghi trùng" onClose={() => { if (!saving && !merging) onClose(); }}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={20} className="shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">
                Hệ thống tìm thấy {duplicateResults.length} hồ sơ khách hàng có thông tin tương tự:
              </p>
              <p className="mt-0.5 text-amber-700">
                Vui lòng chọn: <strong>Dùng hồ sơ sẵn có</strong>, <strong>Gộp hồ sơ</strong> hoặc <strong>Vẫn tạo mới</strong> nếu đây là khách hàng khác.
              </p>
            </div>
          </div>

          <CrmError error={error} />

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {duplicateResults.map(dup => (
              <div key={dup.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-300">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{dup.name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {dup.code}
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      {dup.customer_group_label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dup.match_labels.map((lbl, idx) => (
                      <span key={idx} className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                  <div><span className="text-slate-400">SĐT:</span> <strong className="text-slate-700">{dup.phone || '—'}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <span className="break-all">{dup.email || '—'}</span></div>
                  <div><span className="text-slate-400">Phụ trách:</span> <span>{dup.assigned_to?.name || 'Chưa phân công'}</span></div>
                  <div><span className="text-slate-400">Dữ liệu:</span> <span>{dup.demands_count} nhu cầu · {dup.interactions_count} tương tác</span></div>
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-50 pt-2 text-xs">
                  {onSelectExisting && (
                    <button
                      type="button"
                      disabled={merging || saving}
                      onClick={() => { onClose(); onSelectExisting(dup.id); }}
                      className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <UserCheck size={14} /> Dùng hồ sơ sẵn có
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={merging || saving}
                    onClick={() => handleExecuteMerge(dup)}
                    className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <GitMerge size={14} /> Gộp vào hồ sơ này
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={merging || saving}
              onClick={() => setDuplicateResults(null)}
              className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={13} /> Sửa lại thông tin
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={merging || saving}
                onClick={onClose}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={merging || saving}
                onClick={executeSave}
                className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowRight size={14} /> {isEditing ? 'Vẫn lưu thay đổi' : 'Vẫn tạo mới hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      </CrmDialog>
    );
  }

  return (
    <CrmDialog
      title={isEditing ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
      onClose={() => { if (!saving) onClose(); }}
    >
      <form onSubmit={handlePreSave}>
        <CrmError error={error} />
        <fieldset disabled={saving} className="giang-form-section grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="px-2 text-xs font-bold text-slate-700">Thông tin khách hàng</legend>
          {field('name', 'Tên khách hàng', 'text', true)}
          {field('company', 'Công ty')}
          {mode === 'management' ? (
            <>
              {field('email', 'Email', 'email')}
              {field('phone', 'Số điện thoại (SĐT)', 'tel')}
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                <span>Nhóm khách hàng</span>
                <select className={crmInput} name="customer_group" value={form.customer_group} onChange={change}>
                  <CrmSelectOptions values={options?.groups || {}} />
                </select>
              </label>
              <label className="flex items-center gap-2 self-end py-3 text-sm text-slate-600">
                <input type="checkbox" name="is_tracked" checked={form.is_tracked} onChange={change} />
                Theo dõi khách hàng
              </label>
            </>
          ) : (
            <>
              {field('source', 'Nguồn khách hàng')}
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                <span>Trạng thái</span>
                <select className={crmInput} name="status" value={form.status} onChange={change}>
                  <CrmSelectOptions values={options?.statuses || {}} />
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                <span>Người phụ trách</span>
                <select
                  className={crmInput}
                  name="assigned_to"
                  disabled={!options?.can_assign}
                  value={form.assigned_to}
                  onChange={change}
                >
                  {options?.can_assign && <option value="">Chưa phân công</option>}
                  {(options?.assignees || []).map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <div className="col-span-full">
            <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
              <span>Ghi chú</span>
              <textarea
                name="notes"
                rows={2}
                maxLength={250}
                className={crmInput + ' resize-none'}
                value={form.notes}
                onChange={change}
                placeholder="Ghi chú thêm về nhu cầu hoặc liên hệ..."
              />
            </label>
          </div>
        </fieldset>
        <footer className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Hủy
          </button>
          <button type="submit" disabled={saving} className={crmButton}>
            <Save size={16} />
            {saving ? 'Đang lưu...' : isEditing ? 'Lưu khách hàng' : 'Thêm khách hàng'}
          </button>
        </footer>
      </form>
    </CrmDialog>
  );
}
