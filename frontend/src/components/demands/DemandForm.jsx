import { useConfirm } from '../forms/ConfirmProvider';
import React, { useEffect, useId, useState } from 'react';
import { Save, Search } from 'lucide-react';
import { demandBudget, demandDigits, demandRequest } from '../../services/demands';
import { customerRequest } from '../../services/customers';
import { crmInput, crmButton, CrmError, CrmSelectOptions } from '../customers/CrmDialog';

export default function DemandForm({ demand, options, busy, onBusy, onClose, onSaved }) {
  const confirm = useConfirm();
  const id = useId();
  const [form, setForm] = useState(() => ({ customer_id: demand?.customer_id || '', property_type_id: demand?.property_type_id || '',
    budget_min: demand?.budget_min ?? '', budget_max: demand?.budget_max ?? '', area: demand?.area || '', status: demand?.status || 'processing', notes: demand?.notes || '' }));
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(demand?.customer || null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState('');
  const [lookupRevision, setLookupRevision] = useState(0);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    setCustomerLoading(true); setCustomerError('');
    const timer = setTimeout(() => {
      customerRequest('?' + new URLSearchParams({ search: customerSearch, per_page: 20 }), { signal: controller.signal })
        .then(result => { if (!controller.signal.aborted) setCustomers(result.data); })
        .catch(err => { if (!controller.signal.aborted) setCustomerError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setCustomerLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [customerSearch, lookupRevision]);
  const change = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: name.startsWith('budget_') ? demandDigits(value) : value.slice(0, 250) }));
    setErrors(previous => ({ ...previous, [name]: null }));
    if (name === 'customer_id') setSelectedCustomer(customers.find(customer => String(customer.id) === value) || (String(selectedCustomer?.id) === value ? selectedCustomer : null));
  };
  const save = async event => {
    event.preventDefault();
    setError(''); setErrors({});
    if (Number(form.budget_max) < Number(form.budget_min)) { setErrors({ budget_max: ['Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.'] }); return; }
    if (Boolean(demand) && !(await confirm({ title: 'Xác nhận cập nhật', message: "Lưu các thay đổi của nhu cầu này?" }))) return;
    onBusy(true);
    try {
      const result = await demandRequest(demand ? '/' + demand.id : '', { method: demand ? 'PUT' : 'POST',
        data: { ...form, customer_id: Number(form.customer_id), property_type_id: Number(form.property_type_id), ...(demand ? { version: demand.version } : {}) } });
      onSaved(result.message);
    } catch (err) { setError(err.message); setErrors(err.fields || {}); }
    finally { onBusy(false); }
  };
  const fieldError = name => errors[name] && <span id={id + name + '-error'} className="block text-xs text-rose-600">{errors[name][0]}</span>;
  const textField = (name, label, money = false) => <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
    <span>{label} <span className="text-rose-500">*</span></span>
    <input name={name} type="text" required maxLength={money ? 15 : 250} {...(money ? { inputMode: 'numeric', pattern: '[0-9]{1,15}', title: 'Chỉ nhập số tiền VNĐ, tối đa 15 chữ số' } : {})}
      value={form[name]} onChange={change} className={crmInput} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? id + name + '-error' : undefined} />
    {fieldError(name)}
  </label>;
  const customerOptions = selectedCustomer && !customers.some(customer => customer.id === selectedCustomer.id) ? [selectedCustomer, ...customers] : customers;
  return <form onSubmit={save}>
    <CrmError error={error} />
    <fieldset disabled={busy} className="giang-form-section grid grid-cols-1 gap-4 sm:grid-cols-2">
      <legend className="px-2 text-xs font-bold text-slate-700">Thông tin nhu cầu</legend>
      <div className="space-y-2 sm:col-span-2">
        <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
          <span>Tìm khách hàng theo tên, email hoặc SĐT</span>
          <span className="relative block"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input type="search" maxLength={250} value={customerSearch} onChange={event => setCustomerSearch(event.target.value.slice(0, 250))} className={crmInput + ' pl-9'} placeholder="Tìm trong danh sách khách hàng..." /></span>
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
          <span>Khách hàng <span className="text-rose-500">*</span></span>
          <select required name="customer_id" value={form.customer_id} onChange={change} className={crmInput} aria-invalid={Boolean(errors.customer_id)}>
            <option value="">{customerLoading ? 'Đang tải khách hàng...' : 'Chọn khách hàng'}</option>
            {customerOptions.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ' · ' + customer.phone : ''} · {customer.code || 'KH' + customer.id}</option>)}
          </select>{fieldError('customer_id')}
        </label>
        {customerError ? <p role="alert" className="text-xs text-rose-600">{customerError} <button type="button" onClick={() => setLookupRevision(value => value + 1)} className="underline">Thử lại</button></p>
          : !customerLoading && <p className="text-xs text-slate-400">{customers.length ? 'Hiển thị tối đa 20 kết quả. Nhập từ khóa để tìm khách hàng khác.' : 'Không có khách hàng phù hợp trong phạm vi quản lý của bạn.'}</p>}
      </div>
      <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Loại BĐS <span className="text-rose-500">*</span></span>
        <select required name="property_type_id" value={form.property_type_id} onChange={change} className={crmInput} aria-invalid={Boolean(errors.property_type_id)}>
          <option value="">Chọn loại bất động sản</option>
          {options.property_types.filter(type => Number(type.status) === 1 || type.id === demand?.property_type_id).map(type => <option key={type.id} value={type.id}>{type.name}{Number(type.status) !== 1 ? ' (Ngừng hoạt động)' : ''}</option>)}
        </select>{fieldError('property_type_id')}
      </label>
      <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Trạng thái <span className="text-rose-500">*</span></span>
        <select required name="status" value={form.status} onChange={change} className={crmInput} aria-invalid={Boolean(errors.status)}><CrmSelectOptions values={options.statuses} /></select>{fieldError('status')}
      </label>
      {textField('budget_min', 'Ngân sách từ (VNĐ)', true)}{textField('budget_max', 'Ngân sách đến (VNĐ)', true)}
      {form.budget_min !== '' && form.budget_max !== '' && <p className="text-xs text-slate-500 sm:col-span-2">{demandBudget(form.budget_min, form.budget_max)}</p>}
      <div className="sm:col-span-2">{textField('area', 'Khu vực cần tìm')}</div>
      <label className="space-y-1.5 text-xs font-semibold text-slate-600 sm:col-span-2"><span>Ghi chú / Yêu cầu chi tiết</span>
        <textarea name="notes" rows={3} maxLength={250} value={form.notes} onChange={change} className={crmInput} aria-invalid={Boolean(errors.notes)} />
        <span className="block text-right text-[11px] font-normal text-slate-400">{form.notes.length}/250</span>{fieldError('notes')}
      </label>
    </fieldset>
    <footer className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
      <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Hủy</button>
      <button type="submit" disabled={busy} className={crmButton}><Save size={16} />{busy ? 'Đang lưu...' : demand ? 'Lưu thay đổi' : 'Thêm nhu cầu mới'}</button>
    </footer>
  </form>;
}
