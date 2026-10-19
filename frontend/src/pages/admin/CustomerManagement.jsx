import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Eye, RefreshCw, Search, Trash2 } from 'lucide-react';
import { customerRequest, crmDate } from '../../services/customers';
import { broadcastDataChange, subscribeDataChange } from '../../services/tabSync';
import CustomerForm from '../../components/customers/CustomerForm';
import CustomerDetails from '../../components/customers/CustomerDetails';
import CustomerWorkspace from '../../components/customers/CustomerWorkspace';
import CrmDialog, { crmInput, CrmError } from '../../components/customers/CrmDialog';

export const customerColumns = {
  management: ['Tên khách hàng', 'Công ty', 'Email', 'Số điện thoại', 'Nhóm khách hàng', 'Ngày tạo', 'Hành động'],
  tracking: ['ID', 'Tên khách hàng', 'Công ty/Nguồn', 'Trạng thái', 'Lần tương tác cuối', 'Hoạt động tiếp theo', 'Người phụ trách', 'Hành động'],
};

function initialTab(fallback) {
  if (typeof window === 'undefined') return fallback;
  const tab = new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab');
  return tab === 'tracking' ? 'tracking' : fallback;
}

export default function CustomerManagement({ currentUser, initialView = 'management' }) {
  const [view, setView] = useState(() => initialTab(initialView));
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState(null);
  const [meta, setMeta] = useState({ total: 0, from: 0, to: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  const tracking = view === 'tracking';
  const title = tracking ? 'Theo dõi khách hàng' : 'Quản lý khách hàng';

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ page, per_page: 10, view });
        if (search.trim()) params.set('search', search.trim());
        const [result, settings] = await Promise.all([
          customerRequest('?' + params, { signal: controller.signal }),
          customerRequest('/options', { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        if (page > result.meta.last_page) { setPage(result.meta.last_page); return; }
        setRows(result.data); setMeta(result.meta); setOptions(settings);
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, view, revision, currentUser?.id]);

  useEffect(() => subscribeDataChange(event => {
    if (event.entity === 'customers') setRevision(value => value + 1);
  }), []);
  useEffect(() => {
    const update = () => { setView(initialTab('management')); setPage(1); setSelectedId(null); setEditing(null); setDeleting(null); setNotice(''); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectView = next => {
    setView(next); setPage(1); setSearch(''); setSelectedId(null);
    window.location.hash = '#admin/customers?tab=' + next;
  };
  const changed = message => {
    setNotice(message); setRevision(value => value + 1);
    broadcastDataChange({ entity: 'customers', action: 'update' });
  };
  const edit = customer => { setSelectedId(null); setEditing(customer); };
  const confirmDelete = async () => {
    setDeleteBusy(true); setDeleteError('');
    try {
      const suffix = tracking ? '/tracking' : '';
      const result = await customerRequest('/' + deleting.id + suffix, { method: 'DELETE', data: { version: deleting.version } });
      setDeleting(null); changed(result.message);
    } catch (err) { setDeleteError(err.message); }
    finally { setDeleteBusy(false); }
  };
  const dataCells = row => tracking ? [
    row.code,
    row.name,
    row.company || row.source || '—',
    <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">{options?.statuses[row.status]}</span>,
    row.last_interaction ? options?.types[row.last_interaction.type] + ' – ' + crmDate(row.last_interaction.occurred_at, false) : '—',
    row.next_activity ? <span title={row.next_activity.title}>{row.next_activity.title + ' – ' + crmDate(row.next_activity.scheduled_at, false)}</span> : '—',
    row.assigned_to?.name || 'Chưa phân công',
  ] : [
    row.name,
    row.company || '—',
    row.email || '—',
    row.phone || '—',
    options?.groups[row.customer_group] || '—',
    crmDate(row.created_at, false),
  ];
  const actionLabel = tracking ? 'Xóa khỏi danh sách theo dõi' : 'Xóa thông tin khách hàng';
  const columns = customerColumns[view];

  return <div className="space-y-4">
    <nav className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="Chức năng khách hàng">
      {[['management', 'Quản lý khách hàng'], ['tracking', 'Theo dõi khách hàng']].map(([key, label]) =>
        <button key={key} id={'customer-tab-' + key} type="button" role="tab" aria-selected={view === key} aria-controls="customer-list-panel" onClick={() => selectView(key)}
          className={'border-b-2 px-4 py-3 text-sm font-semibold ' + (view === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>{label}</button>
      )}
    </nav>
    <section id="customer-list-panel" role="tabpanel" aria-labelledby={'customer-tab-' + view} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          <label className="relative block"><span className="sr-only">Tìm khách hàng</span><Search size={15} className="absolute left-3 top-3 text-slate-400" />
            <input type="search" maxLength={250} value={search} onChange={event => { setSearch(event.target.value.slice(0, 250)); setPage(1); }} placeholder="Tìm khách hàng..." className={crmInput + ' pl-9 sm:w-64'} />
          </label>
          <button type="button" title="Tải lại danh sách" aria-label="Tải lại danh sách khách hàng" disabled={loading} onClick={() => setRevision(value => value + 1)} className="rounded border border-slate-300 p-2.5 text-slate-500 disabled:opacity-40"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>
      {error && <div className="p-4 pb-0"><CrmError error={error} /></div>}
      {notice && <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</p>}
      <div className="overflow-x-auto">
        <table className={'w-full text-left text-sm ' + (tracking ? 'min-w-[1080px]' : 'min-w-[850px]')} aria-label={title} aria-busy={loading}>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600"><tr>{columns.map(label => <th key={label} scope="col" className={'px-4 py-3 ' + (label === 'Hành động' ? 'text-right' : '')}>{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 4 }, (_, index) => <tr key={index} className="animate-pulse">{columns.map(label => <td key={label} className="px-4 py-4"><div className="h-3 rounded bg-slate-100" /></td>)}</tr>)
              : !error && rows.length === 0 ? <tr><td colSpan={columns.length} className="p-8 text-center text-slate-500">{search ? 'Không tìm thấy khách hàng phù hợp.' : tracking ? 'Chưa có khách hàng trong danh sách theo dõi.' : 'Chưa có khách hàng.'}</td></tr>
              : !error && rows.map(row => <tr key={row.id} className="align-top hover:bg-slate-50/60">
                {dataCells(row).map((cell, index) => <td key={columns[index]} className={'max-w-[240px] break-words px-4 py-3 text-slate-700 ' + ((!tracking && index === 2) ? 'break-all' : '')}>{cell}</td>)}
                <td className="px-3 py-2"><div className="flex justify-end gap-1">
                  <button type="button" title={tracking ? 'Xem thông tin và lịch sử tương tác' : 'Xem thông tin khách hàng'} aria-label={'Xem khách hàng ' + row.name} onClick={() => setSelectedId(row.id)} className="rounded p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></button>
                  <button type="button" title="Chỉnh sửa thông tin khách hàng" aria-label={'Sửa khách hàng ' + row.name} onClick={() => edit(row)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><Edit3 size={16} /></button>
                  <button type="button" title={actionLabel} aria-label={actionLabel + ' ' + row.name} onClick={() => { setDeleteError(''); setDeleting(row); }} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                </div></td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
        <p>Hiển thị {meta.from || 0}-{meta.to || 0} trong tổng số {meta.total} khách hàng</p>
        {meta.last_page > 1 && <div className="flex items-center gap-3">
          <button type="button" aria-label="Trang trước" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} className="rounded border bg-white p-1 disabled:opacity-30"><ChevronLeft size={15} /></button>
          <span>{page}/{meta.last_page}</span>
          <button type="button" aria-label="Trang sau" disabled={loading || page >= meta.last_page} onClick={() => setPage(page + 1)} className="rounded border bg-white p-1 disabled:opacity-30"><ChevronRight size={15} /></button>
        </div>}
      </footer>
    </section>
    {editing && options && <CustomerForm key={editing.id} customer={editing} options={options} currentUser={currentUser} mode={view} onClose={() => setEditing(null)} onSaved={message => { setEditing(null); changed(message); }} />}
    {selectedId && options && (tracking
      ? <CustomerWorkspace key={selectedId} id={selectedId} options={options} onClose={() => setSelectedId(null)} onEdit={edit} onChanged={changed} />
      : <CustomerDetails key={selectedId} id={selectedId} options={options} onClose={() => setSelectedId(null)} />)}
    {deleting && <CrmDialog title={tracking ? 'Gỡ khách hàng khỏi danh sách theo dõi?' : 'Xóa thông tin khách hàng?'} onClose={() => { if (!deleteBusy) setDeleting(null); }}>
      <CrmError error={deleteError} />
      <p className="text-sm leading-6 text-slate-600">{tracking ? 'Gỡ ' : 'Xóa hồ sơ '}<strong>{deleting.name}</strong>{tracking ? ' khỏi danh sách theo dõi. Thông tin khách hàng vẫn được giữ ở tab Quản lý khách hàng.' : ' khỏi hệ thống quản lý khách hàng và danh sách theo dõi.'}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" disabled={deleteBusy} onClick={() => setDeleting(null)} className="rounded border border-slate-300 px-4 py-2 text-sm">Hủy</button>
        <button type="button" disabled={deleteBusy} onClick={confirmDelete} className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleteBusy ? 'Đang xử lý...' : tracking ? 'Gỡ theo dõi' : 'Xóa khách hàng'}</button>
      </div>
    </CrmDialog>}
  </div>;
}
