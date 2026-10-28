import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Eye, Filter, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import CrmDialog, { crmButton, CrmError, crmInput, CrmSelectOptions } from '../../components/customers/CrmDialog';
import DemandDialog from '../../components/demands/DemandDialog';
import { crmDate } from '../../services/customers';
import { demandBudget, demandDigits, demandRequest, demandStatusStyles } from '../../services/demands';
import { broadcastDataChange, subscribeDataChange } from '../../services/tabSync';
import useRecordLink from '../../hooks/useRecordLink';

export const demandColumns = ['ID Nhu cầu', 'Tên khách hàng', 'Loại BĐS', 'Ngân sách', 'Khu vực', 'Trạng thái', 'Ngày tạo', 'Hành động'];
const emptyFilters = { property_type_id: '', budget_min: '', budget_max: '', area: '', status: '' };
const emptyOptions = { property_types: [], statuses: {} };

export default function DemandManagement({ currentUser }) {
  const allowed = Boolean(currentUser?.id && [1, 2].includes(Number(currentUser.role_id)));
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState(emptyOptions);
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState({ total: 0, from: 0, to: 0, last_page: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  useRecordLink('demands', ({ id }) => { if (id) setDialog({ mode: 'view', id }); });

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ search, page });
      for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, value);
      try {
        const [result, settings] = await Promise.all([demandRequest('?' + params, { signal: controller.signal }), demandRequest('/options', { signal: controller.signal })]);
        if (controller.signal.aborted) return;
        setOptions(settings); setReady(true);
        if (page > result.meta.last_page) { setPage(result.meta.last_page); return; }
        setRows(result.data); setMeta(result.meta);
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [allowed, currentUser?.id, currentUser?.role_id, page, search, filters, revision]);

  useEffect(() => subscribeDataChange(event => {
    if (['demands', 'customers', 'property_types'].includes(event.entity)) setRevision(value => value + 1);
  }), []);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRevision(value => value + 1); };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  const changed = message => {
    setDialog(null); setDeleting(null); setNotice(message); setRevision(value => value + 1);
    broadcastDataChange({ entity: 'demands', action: 'update' });
    window.dispatchEvent(new CustomEvent('3tv:notifications-changed'));
  };
  const resetFilters = () => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); setFilterError(''); };
  const changeFilter = event => {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: name.startsWith('budget_') ? demandDigits(value) : value.slice(0, 250) }));
    setFilterError('');
  };
  const applyFilters = event => {
    event.preventDefault();
    if (draft.budget_min !== '' && draft.budget_max !== '' && Number(draft.budget_min) > Number(draft.budget_max)) {
      setFilterError('Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.'); return;
    }
    setFilters({ ...draft }); setPage(1); setFilterError('');
  };
  const confirmDelete = async () => {
    setDeleteBusy(true); setDeleteError('');
    try { changed((await demandRequest('/' + deleting.id, { method: 'DELETE', data: { version: deleting.version } })).message); }
    catch (err) { setDeleteError(err.message); }
    finally { setDeleteBusy(false); }
  };
  const edit = id => setDialog({ mode: 'edit', id });
  const activeFilters = Object.values(filters).filter(value => value !== '').length;
  if (!allowed) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Vui lòng đăng nhập bằng tài khoản Admin hoặc Môi giới để quản lý nhu cầu.</p>;

  return <div className="space-y-4">
    <header className="giang-page-heading flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div><p className="giang-eyebrow mb-1">3TV LAND / NHU CẦU</p><h2>Quản lý nhu cầu</h2><p className="mt-1 text-xs text-slate-500">Theo dõi và xử lý yêu cầu tìm kiếm bất động sản của khách hàng.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:flex-none"><span className="sr-only">Tìm kiếm nhu cầu</span><Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input type="search" maxLength={250} value={search} onChange={event => { setSearch(event.target.value.slice(0, 250)); setPage(1); }} placeholder="Tìm kiếm nhu cầu..." className={crmInput + ' pl-9 sm:w-60'} />
        </label>
        <button type="button" aria-expanded={filterOpen} aria-controls="demand-filters" onClick={() => setFilterOpen(value => !value)} className={'inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ' + (activeFilters || filterOpen ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600')}><Filter size={16} />Bộ lọc{activeFilters > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">{activeFilters}</span>}</button>
        <button type="button" disabled={!ready || loading || Boolean(error)} onClick={() => setDialog({ mode: 'create' })} className={crmButton}><Plus size={16} />THÊM NHU CẦU MỚI</button>
      </div>
    </header>
    {filterOpen && <form id="demand-filters" onSubmit={applyFilters} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Loại BĐS</span><select name="property_type_id" value={draft.property_type_id} onChange={changeFilter} className={crmInput}><option value="">Tất cả loại BĐS</option>{options.property_types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
        <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Khu vực</span><input name="area" type="text" maxLength={250} value={draft.area} onChange={changeFilter} placeholder="Ví dụ: Quận 1, TP.HCM" className={crmInput} /></label>
        <label className="space-y-1.5 text-xs font-semibold text-slate-600"><span>Trạng thái</span><select name="status" value={draft.status} onChange={changeFilter} className={crmInput}><option value="">Tất cả trạng thái</option><CrmSelectOptions values={options.statuses} /></select></label>
        {[['budget_min', 'Ngân sách từ (VNĐ)'], ['budget_max', 'Ngân sách đến (VNĐ)']].map(([name, label]) => <label key={name} className="space-y-1.5 text-xs font-semibold text-slate-600"><span>{label}</span><input type="text" inputMode="numeric" pattern="[0-9]{1,15}" maxLength={15} name={name} value={draft[name]} onChange={changeFilter} className={crmInput} /></label>)}
      </div>
      <p className="text-xs text-slate-400">Lọc các nhu cầu có khoảng ngân sách giao với khoảng bạn nhập.</p>
      <CrmError error={filterError} />
      <div className="flex justify-end gap-2"><button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">Xóa bộ lọc</button><button type="submit" className={crmButton}>Áp dụng</button></div>
    </form>}
    {notice && <p role="status" className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h3 className="text-sm font-bold text-slate-800">Danh sách Nhu cầu</h3><button type="button" disabled={loading} aria-label="Tải lại danh sách nhu cầu" title="Tải lại danh sách" onClick={() => setRevision(value => value + 1)} className="rounded p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></header>
      {error && <div className="p-4"><CrmError error={error} /><div className="flex gap-3 text-sm"><button type="button" onClick={() => setRevision(value => value + 1)} className="font-semibold text-blue-600">Thử lại</button>{activeFilters > 0 && <button type="button" onClick={resetFilters} className="text-slate-500">Xóa bộ lọc</button>}</div></div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm" aria-label="Danh sách nhu cầu" aria-busy={loading}>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr>{demandColumns.map(label => <th key={label} scope="col" className={'px-4 py-3 font-semibold ' + (label === 'Hành động' ? 'text-right' : '')}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? Array.from({ length: 4 }, (_, index) => <tr key={index} className="animate-pulse">{demandColumns.map(label => <td key={label} className="px-4 py-4"><div className="h-3 rounded bg-slate-100" /></td>)}</tr>)
            : !error && !rows.length ? <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">{search || activeFilters ? 'Không tìm thấy nhu cầu phù hợp.' : 'Chưa có nhu cầu. Nhấn “Thêm nhu cầu mới” để ghi nhận yêu cầu của khách hàng.'}</td></tr>
            : !error && rows.map(row => <tr key={row.id} className="align-top hover:bg-slate-50/60">
              <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500">{row.code}</td>
              <td className="max-w-[180px] break-words px-4 py-3 font-medium text-slate-800">{row.customer?.name || '—'}</td>
              <td className="max-w-[160px] break-words px-4 py-3 text-slate-600">{row.property_type?.name || '—'}</td>
              <td className="min-w-[200px] max-w-[260px] px-4 py-3 text-slate-700">{demandBudget(row.budget_min, row.budget_max)}</td>
              <td className="max-w-[180px] break-words px-4 py-3 text-slate-600">{row.area}</td>
              <td className="px-4 py-3"><span className={'inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ' + demandStatusStyles[row.status]}>{options.statuses[row.status] || row.status}</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{crmDate(row.created_at, false)}</td>
              <td className="px-3 py-2"><div className="flex justify-end gap-1">
                <button type="button" title="Xem chi tiết nhu cầu" aria-label={'Xem nhu cầu ' + row.code} onClick={() => setDialog({ mode: 'view', id: row.id })} className="rounded p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Eye size={16} /></button>
                <button type="button" title="Chỉnh sửa nhu cầu" aria-label={'Sửa nhu cầu ' + row.code} onClick={() => edit(row.id)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><Edit3 size={16} /></button>
                <button type="button" title="Xóa nhu cầu" aria-label={'Xóa nhu cầu ' + row.code} onClick={() => { setDialog(null); setDeleting(row); setDeleteError(''); }} className="rounded p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
              </div></td>
            </tr>)}
        </tbody>
      </table></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
        <span>Hiển thị {meta.from || 0}-{meta.to || 0} trong tổng số {meta.total} nhu cầu</span>
        {meta.last_page > 1 && <div className="flex items-center gap-3"><button type="button" aria-label="Trang trước" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)} className="rounded border bg-white p-1 disabled:opacity-30"><ChevronLeft size={15} /></button><span>{page}/{meta.last_page}</span><button type="button" aria-label="Trang sau" disabled={loading || page >= meta.last_page} onClick={() => setPage(value => value + 1)} className="rounded border bg-white p-1 disabled:opacity-30"><ChevronRight size={15} /></button></div>}
      </footer>
    </section>
    {dialog && ready && <DemandDialog key={dialog.mode + '-' + (dialog.id || 'new')} {...dialog} options={options} onClose={() => setDialog(null)} onEdit={edit} onSaved={changed} />}
    {deleting && <CrmDialog title="Xóa nhu cầu?" onClose={() => { if (!deleteBusy) setDeleting(null); }}>
      <CrmError error={deleteError} />
      <p className="text-sm leading-6 text-slate-600">Xóa nhu cầu <strong>{deleting.code}</strong> của <strong>{deleting.customer?.name}</strong> khỏi danh sách?</p>
      <footer className="mt-5 flex flex-wrap justify-end gap-3">
        {deleteError && <button type="button" disabled={deleteBusy} onClick={() => { setDeleting(null); setRevision(value => value + 1); }} className="text-sm font-semibold text-blue-600">Tải lại danh sách</button>}
        <button type="button" disabled={deleteBusy} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">Hủy</button>
        <button type="button" disabled={deleteBusy} onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleteBusy ? 'Đang xóa...' : 'Xóa nhu cầu'}</button>
      </footer>
    </CrmDialog>}
  </div>;
}
