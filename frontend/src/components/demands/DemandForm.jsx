import { useConfirm } from '../forms/ConfirmProvider';
import React, { useEffect, useId, useState } from 'react';
import { Save, Search } from 'lucide-react';
import { demandBudget, demandDigits, demandRequest } from '../../services/demands';
import { customerRequest } from '../../services/customers';
import { crmInput, crmButton, CrmError, CrmSelectOptions } from '../customers/CrmDialog';

export default function DemandForm({ demand, options = {}, busy, onBusy, onClose, onSaved }) {
  const confirm = useConfirm();
  const id = useId();
  const [form, setForm] = useState(() => ({
    customer_id: demand?.customer_id || '',
    property_type_id: demand?.property_type_id || '',
    category_id: demand?.category_id || '',
    province_id: demand?.province_id || '',
    district_id: demand?.district_id || '',
    ward_id: demand?.ward_id || '',
    bedrooms: demand?.bedrooms ?? '',
    bathrooms: demand?.bathrooms ?? '',
    budget_min: demand?.budget_min ?? '',
    budget_max: demand?.budget_max ?? '',
    area: demand?.area || '',
    status: demand?.status || 'processing',
    notes: demand?.notes || ''
  }));
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
      const payload = {
        ...form,
        customer_id: Number(form.customer_id),
        property_type_id: form.property_type_id ? Number(form.property_type_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        province_id: form.province_id ? Number(form.province_id) : null,
        district_id: form.district_id ? Number(form.district_id) : null,
        ward_id: form.ward_id ? Number(form.ward_id) : null,
        bedrooms: form.bedrooms !== '' ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms !== '' ? Number(form.bathrooms) : null,
        ...(demand ? { version: demand.version } : {})
      };
      const result = await demandRequest(demand ? '/' + demand.id : '', { method: demand ? 'PUT' : 'POST', data: payload });
      onSaved(result.message);
    } catch (err) { setError(err.message); setErrors(err.fields || {}); }
    finally { onBusy(false); }
  };
  const fieldError = name => errors[name] && <span id={id + name + '-error'} className="block text-xs text-rose-600">{errors[name][0]}</span>;
  const textField = (name, label, money = false, required = true) => <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
    <span>{label} {required && <span className="text-rose-500">*</span>}</span>
    <input name={name} type="text" required={required} maxLength={money ? 15 : 250} {...(money ? { inputMode: 'numeric', pattern: '[0-9]{1,15}', title: 'Chỉ nhập số tiền VNĐ, tối đa 15 chữ số' } : {})}
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
          {options.property_types?.filter(type => Number(type.status) === 1 || type.id === demand?.property_type_id).map(type => <option key={type.id} value={type.id}>{type.name}{Number(type.status) !== 1 ? ' (Ngừng hoạt động)' : ''}</option>)}
        </select>{fieldError('property_type_id')}
      </label>
      {options.categories?.length > 0 && <label className="space-y-1.5 text-xs font-semibold text-slate-600">
        <span>Danh mục BĐS (ghép tự động)</span>
        <select name="category_id" value={form.category_id} onChange={change} className={crmInput}>
          <option value="">Tất cả danh mục BĐS</option>
          {options.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>{fieldError('category_id')}
      </label>}
      <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Trạng thái <span className="text-rose-500">*</span></span>
        <select required name="status" value={form.status} onChange={change} className={crmInput} aria-invalid={Boolean(errors.status)}><CrmSelectOptions values={options.statuses} /></select>{fieldError('status')}
      </label>
      {textField('budget_min', 'Ngân sách từ (VNĐ)', true)}{textField('budget_max', 'Ngân sách đến (VNĐ)', true)}
      {form.budget_min !== '' && form.budget_max !== '' && <p className="text-xs text-slate-500 sm:col-span-2">{demandBudget(form.budget_min, form.budget_max)}</p>}

      {/* Khu vực có cấu trúc (bảng tham chiếu để ghép tự động) */}
      {options.provinces?.length > 0 && <div className="space-y-3 sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <p className="text-xs font-bold text-slate-700">Khu vực tìm kiếm (ghép tự động theo địa giới)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs font-semibold text-slate-600">
            <span>Tỉnh / Thành phố</span>
            <select name="province_id" value={form.province_id} onChange={change} className={crmInput}>
              <option value="">Tất cả tỉnh / thành</option>
              {options.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>{fieldError('province_id')}
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600">
            <span>Quận / Huyện</span>
            <select name="district_id" value={form.district_id} onChange={change} className={crmInput}>
              <option value="">Tất cả quận / huyện</option>
              {options.districts?.filter(d => !form.province_id || Number(d.province_id) === Number(form.province_id)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>{fieldError('district_id')}
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600">
            <span>Phường / Xã</span>
            <select name="ward_id" value={form.ward_id} onChange={change} className={crmInput}>
              <option value="">Tất cả phường / xã</option>
              {options.wards?.filter(w => !form.district_id || Number(w.district_id) === Number(form.district_id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>{fieldError('ward_id')}
          </label>
        </div>
      </div>}

      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <label className="space-y-1.5 text-xs font-semibold text-slate-600">
          <span>Số phòng ngủ (tối thiểu)</span>
          <input name="bedrooms" type="number" min="0" max="100" placeholder="VD: 2" value={form.bedrooms} onChange={change} className={crmInput} />
          {fieldError('bedrooms')}
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-slate-600">
          <span>Số phòng tắm (tối thiểu)</span>
          <input name="bathrooms" type="number" min="0" max="100" placeholder="VD: 1" value={form.bathrooms} onChange={change} className={crmInput} />
          {fieldError('bathrooms')}
        </label>
      </div>

      <div className="sm:col-span-2">{textField('area', 'Khu vực cần tìm (tùy chọn / chuỗi nhập nhanh)', false, false)}</div>
      <label className="space-y-1.5 text-xs font-semibold text-slate-600 sm:col-span-2"><span>Ghi chú / Yêu cầu chi tiết (tùy chọn)</span>
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
