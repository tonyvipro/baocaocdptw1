import React, { useEffect, useState } from 'react';
import { customerRequest, crmDate } from '../../services/customers';
import CrmDialog, { CrmError } from './CrmDialog';

export default function CustomerDetails({ id, options, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    customerRequest(`/${id}`, { signal: controller.signal }).then(result => setCustomer(result.data))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [id]);
  const fields = customer ? [
    ['Tên khách hàng', customer.name], ['Công ty', customer.company], ['Email', customer.email],
    ['Số điện thoại', customer.phone], ['Nhóm khách hàng', options.groups[customer.customer_group]],
    ['Ngày tạo', crmDate(customer.created_at, false)],
  ] : [];
  return <CrmDialog title="Thông tin khách hàng" onClose={onClose}>
    <CrmError error={error} />
    {!customer && !error && <p role="status" className="text-sm text-slate-500">Đang tải thông tin khách hàng...</p>}
    <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="mb-1 text-xs text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-800">{value || '—'}</dd></div>)}</dl>
  </CrmDialog>;
}
