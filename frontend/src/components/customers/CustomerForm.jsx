import { useConfirm } from '../forms/ConfirmProvider';
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { customerRequest } from '../../services/customers';
import CrmDialog, { crmInput, crmButton, CrmError, CrmSelectOptions } from './CrmDialog';

export default function CustomerForm({ customer, options, onClose, onSaved, mode = 'management' }) {
  const confirm = useConfirm();
  const [form, setForm] = useState(() => ({
    name: customer?.name || '', company: customer?.company || '', source: customer?.source || '',
    email: customer?.email || '', phone: customer?.phone || '', notes: customer?.notes || '',
    customer_group: customer?.customer_group || 'new', status: customer?.status || 'new',
    assigned_to: customer.assigned_to?.id ?? '',
    is_tracked: customer?.is_tracked ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const change = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : name === 'phone' ? value.replace(/[^0-9]/g, '').slice(0, 11) : value.slice(0, 250) }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };
  const save = async event => {
    event.preventDefault();
    if (true && !(await confirm({ title: 'Xác nhận cập nhật', message: "Lưu các thay đổi của khách hàng này?" }))) return;
    setSaving(true); setError(''); setErrors({});
    try {
      const data = { ...form, assigned_to: form.assigned_to ? Number(form.assigned_to) : null, version: customer.version };
      const result = await customerRequest(`/${customer.id}`, { method: 'PUT', data });
      onSaved(result.message);
    } catch (err) { setError(err.message); setErrors(err.fields || {}); }
    finally { setSaving(false); }
  };
  const field = (name, label, type = 'text', required = false) => <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
    <span>{label}{required && <span className="text-rose-500"> *</span>}</span>
    <input className={crmInput} name={name} type={type} required={required} maxLength={name === 'phone' ? 11 : 250} {...(name === 'phone' ? { inputMode: 'numeric', pattern: '[0-9]{10,11}', minLength: 10, title: 'Chỉ nhập 10–11 chữ số' } : {})} value={form[name]} onChange={change} aria-invalid={Boolean(errors[name])} />
    {errors[name] && <span className="block text-rose-600">{errors[name][0]}</span>}
  </label>;
  return <CrmDialog title="Chỉnh sửa thông tin khách hàng" onClose={() => { if (!saving) onClose(); }}>
    <form onSubmit={save}>
      <CrmError error={error} />
      <fieldset disabled={saving} className="giang-form-section grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="px-2 text-xs font-bold text-slate-700">Thông tin khách hàng</legend>
        {field('name', 'Tên khách hàng', 'text', true)}{field('company', 'Công ty')}
        {mode === 'management' ? <>
          {field('email', 'Email', 'email')}{field('phone', 'Số điện thoại (10–11 số)', 'tel')}
          <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Nhóm khách hàng</span><select className={crmInput} name="customer_group" value={form.customer_group} onChange={change}><CrmSelectOptions values={options.groups} /></select></label>
          <label className="flex items-center gap-2 self-end py-3 text-sm text-slate-600"><input type="checkbox" name="is_tracked" checked={form.is_tracked} onChange={change} />Theo dõi khách hàng</label>
        </> : <>
          {field('source', 'Nguồn khách hàng')}
          <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Trạng thái</span><select className={crmInput} name="status" value={form.status} onChange={change}><CrmSelectOptions values={options.statuses} /></select></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Người phụ trách</span><select className={crmInput} name="assigned_to" disabled={!options.can_assign} value={form.assigned_to} onChange={change}>
          {options.can_assign && <option value="">Chưa phân công</option>}
          {options.assignees.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select></label>
        </>}
      </fieldset>
      <footer className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Hủy</button>
        <button type="submit" disabled={saving} className={crmButton}><Save size={16} />{saving ? 'Đang lưu...' : 'Lưu khách hàng'}</button>
      </footer>
    </form>
  </CrmDialog>;
}
