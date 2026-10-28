import React, { useEffect, useState } from 'react';
import { Edit3, RefreshCw } from 'lucide-react';
import CrmDialog, { CrmError, crmButton } from '../customers/CrmDialog';
import { crmDate } from '../../services/customers';
import { demandBudget, demandRequest, demandStatusStyles } from '../../services/demands';
import DemandForm from './DemandForm';

export function DemandDetails({ demand, options }) {
  const fields = [
    ['ID Nhu cầu', demand.code], ['Tên khách hàng', demand.customer?.name],
    ['Số điện thoại', demand.customer?.phone], ['Email', demand.customer?.email],
    ['Loại BĐS', demand.property_type?.name], ['Ngân sách', demandBudget(demand.budget_min, demand.budget_max)],
    ['Khu vực', demand.area], ['Trạng thái', <span className={'inline-block rounded-full border px-2.5 py-1 text-xs ' + demandStatusStyles[demand.status]}>{options.statuses[demand.status]}</span>],
    ['Ngày tạo', crmDate(demand.created_at)], ['Cập nhật lần cuối', crmDate(demand.updated_at)], ['Yêu cầu chi tiết', demand.notes],
  ];
  return <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className={label === 'Yêu cầu chi tiết' ? 'sm:col-span-2' : ''}>
    <dt className="mb-1 text-xs font-medium text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm text-slate-700">{value || '—'}</dd>
  </div>)}</dl>;
}

export default function DemandDialog({ mode, id, options, onClose, onEdit, onSaved }) {
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    demandRequest('/' + id, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) setDemand(result.data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  const title = mode === 'create' ? 'Thêm nhu cầu mới' : mode === 'edit' ? 'Chỉnh sửa nhu cầu' : 'Chi tiết nhu cầu ' + (demand?.code || '');
  return <CrmDialog title={title} onClose={() => { if (!busy) onClose(); }}>
    {loading ? <div aria-label="Đang tải chi tiết nhu cầu" className="animate-pulse space-y-4">{[1, 2, 3, 4].map(key => <div key={key} className="h-6 rounded bg-slate-100" />)}</div>
      : error ? <><CrmError error={error} /><button type="button" onClick={() => setRevision(value => value + 1)} className={crmButton}><RefreshCw size={15} />Thử lại</button></>
      : mode === 'view' && demand ? <>
        <DemandDetails demand={demand} options={options} />
        <footer className="mt-5 flex justify-end border-t border-slate-100 pt-4"><button type="button" onClick={() => onEdit(id)} className={crmButton}><Edit3 size={16} />Chỉnh sửa nhu cầu</button></footer>
      </> : (mode === 'create' || demand) && <DemandForm demand={demand} options={options} busy={busy} onBusy={setBusy} onClose={onClose} onSaved={onSaved} />}
  </CrmDialog>;
}
