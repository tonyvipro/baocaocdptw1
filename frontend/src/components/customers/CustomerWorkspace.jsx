import React, { useEffect, useState } from 'react';
import { CalendarClock, Check, Clock, Edit3, History, Plus, RefreshCw, UserRound } from 'lucide-react';
import { customerRequest, crmDate, crmLocalTime, crmIsoTime, isOverdue } from '../../services/customers';
import CrmDialog, { crmInput, crmButton, CrmError, CrmSelectOptions } from './CrmDialog';

function SmallPager({ data, onPage }) {
  if (!data || data.last_page <= 1) return null;
  return <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
    <span>Trang {data.current_page}/{data.last_page} · {data.total} bản ghi</span>
    <div className="flex gap-2"><button type="button" disabled={data.current_page <= 1} onClick={() => onPage(data.current_page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Trước</button><button type="button" disabled={data.current_page >= data.last_page} onClick={() => onPage(data.current_page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Sau</button></div>
  </div>;
}

export default function CustomerWorkspace({ id, options, onClose, onEdit, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [revision, setRevision] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [editingActivity, setEditingActivity] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [interaction, setInteraction] = useState({ type: 'call', summary: '', occurred_at: crmLocalTime() });
  const [activity, setActivity] = useState({ type: 'call', title: '', scheduled_at: crmLocalTime(new Date(Date.now() + 86400000)) });
  const resetActivity = () => {
    setEditingActivity(null);
    setActivity({ type: 'call', title: '', scheduled_at: crmLocalTime(new Date(Date.now() + 86400000)) });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    customerRequest(`/${id}?history_page=${historyPage}&activity_page=${activityPage}`, { signal: controller.signal })
      .then(setDetail).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, historyPage, activityPage, revision]);

  const mutate = async (key, path, method, data) => {
    setBusy(key); setActionError('');
    try {
      const result = await customerRequest(`/${id}${path}`, { method, data });
      if (key === 'interaction') { setInteraction({ type: interaction.type, summary: '', occurred_at: crmLocalTime() }); setHistoryPage(1); }
      if (key === 'activity') { resetActivity(); setActivityPage(1); }
      if (key === `complete-${editingActivity}` || key === `cancel-${editingActivity}`) resetActivity();
      setCancelId(null);
      setRevision(value => value + 1);
      onChanged(result.message);
    } catch (error) { setActionError(error.message); }
    finally { setBusy(''); }
  };
  const customer = detail?.data;
  return <CrmDialog title={customer ? `${customer.name} · ${customer.code}` : 'Hồ sơ & chăm sóc khách hàng'} subtitle="Thông tin, lịch sử tương tác và kế hoạch tiếp theo · Giờ Việt Nam (UTC+7)" wide onClose={() => { if (!busy) onClose(); }}>
    <CrmError error={loadError} />
    {loading && !detail && <div role="status" className="space-y-4 animate-pulse"><div className="h-28 rounded-xl bg-slate-100" /><div className="h-64 rounded-xl bg-slate-100" /><span className="sr-only">Đang tải hồ sơ</span></div>}
    {loadError && <button type="button" onClick={() => setRevision(value => value + 1)} className={crmButton}>Thử tải lại</button>}
    {customer && !loadError && <>
      <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">{customer.name.slice(0, 1).toUpperCase()}</div><div><h3 className="font-bold text-slate-900">{customer.name}</h3><p className="mt-0.5 text-xs text-slate-500">Tạo {crmDate(customer.created_at, false)} · {options.groups[customer.customer_group]}</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{options.statuses[customer.status]}</span><button type="button" aria-label="Tải lại hồ sơ khách hàng" disabled={Boolean(busy) || loading} onClick={() => { resetActivity(); setCancelId(null); setActionError(''); setRevision(value => value + 1); }} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500"><RefreshCw size={14} /></button><button type="button" disabled={Boolean(busy) || loading} onClick={() => onEdit(customer)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><Edit3 size={14} />Chỉnh sửa</button></div>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Liên hệ</dt><dd className="break-all text-slate-700">{customer.phone || 'Chưa có SĐT'}<br />{customer.email || 'Chưa có email'}</dd></div>
          <div><dt className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Công ty / Nguồn</dt><dd className="break-words text-slate-700">{customer.company || 'Cá nhân'}<br /><span className="text-slate-500">{customer.source || 'Chưa cập nhật nguồn'}</span></dd></div>
          <div><dt className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Người phụ trách</dt><dd className="flex items-center gap-1.5 text-slate-700"><UserRound size={14} />{customer.assigned_to?.name || 'Chưa phân công'}</dd></div>
          <div><dt className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Nhu cầu / Ghi chú</dt><dd className="break-words whitespace-pre-wrap text-slate-700">{customer.notes || 'Chưa có ghi chú'}</dd></div>
        </dl>
      </section>
      <CrmError error={actionError} />
      {loading && <p role="status" className="mb-3 text-xs text-blue-600">Đang cập nhật hồ sơ...</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><History size={17} className="text-blue-600" /><h3 className="text-sm font-bold text-slate-800">Lịch sử tương tác</h3><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{detail.interactions.total}</span></div>
          <div className="p-4">
            <form onSubmit={event => { event.preventDefault(); mutate('interaction', '/interactions', 'POST', { ...interaction, occurred_at: crmIsoTime(interaction.occurred_at) }); }} className="mb-5 space-y-3 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-700">Ghi nhận tương tác đã diễn ra</p>
              <fieldset disabled={Boolean(busy) || loading} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-slate-500"><span>Hình thức</span><select className={crmInput} value={interaction.type} onChange={event => setInteraction({ ...interaction, type: event.target.value })}><CrmSelectOptions values={options.types} /></select></label><label className="space-y-1 text-xs text-slate-500"><span>Thời điểm tương tác</span><input type="datetime-local" required value={interaction.occurred_at} max={crmLocalTime()} onChange={event => setInteraction({ ...interaction, occurred_at: event.target.value })} className={crmInput} /></label></div>
                <label className="block space-y-1 text-xs text-slate-500"><span>Nội dung tương tác</span><textarea required maxLength={250} rows={2} value={interaction.summary} onChange={event => setInteraction({ ...interaction, summary: event.target.value.slice(0, 250) })} placeholder="Nhu cầu, nội dung trao đổi và kết quả..." className={crmInput} /></label>
                <button type="submit" className={crmButton}><Plus size={14} />{busy === 'interaction' ? 'Đang lưu...' : 'Lưu tương tác'}</button>
              </fieldset>
            </form>
            {detail.interactions.data.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">Chưa có tương tác. Ghi lại cuộc trao đổi đầu tiên ở trên.</p> : <ol className="space-y-4">{detail.interactions.data.map(item => <li key={item.id} className="relative border-l-2 border-blue-100 pl-4">
              <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex flex-wrap justify-between gap-1 text-xs"><span className="font-bold text-blue-700">{options.types[item.type]}</span><time className="text-slate-400">{crmDate(item.occurred_at)}</time></div><p className="mt-1.5 break-words whitespace-pre-wrap text-sm text-slate-700">{item.summary}</p><p className="mt-1 text-[11px] text-slate-400">{item.actor?.name || 'Nhân viên đã ngừng hoạt động'}</p>
            </li>)}</ol>}
            <SmallPager data={detail.interactions} onPage={setHistoryPage} />
          </div>
        </section>
        <section className="min-w-0 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><CalendarClock size={17} className="text-amber-600" /><h3 className="text-sm font-bold text-slate-800">Kế hoạch chăm sóc</h3><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{detail.activities.total}</span></div>
          <div className="p-4">
            <form id="crm-activity-form" onSubmit={event => { event.preventDefault(); mutate('activity', editingActivity ? `/activities/${editingActivity}` : '/activities', editingActivity ? 'PATCH' : 'POST', { ...activity, scheduled_at: crmIsoTime(activity.scheduled_at), ...(editingActivity ? { version: customer.version } : {}) }); }} className="mb-5 space-y-3 rounded-xl bg-amber-50/60 p-3">
              <p className="text-xs font-bold text-slate-700">{editingActivity ? 'Chỉnh sửa lịch chăm sóc' : 'Lên lịch hoạt động tiếp theo'}</p>
              <fieldset disabled={Boolean(busy) || loading} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-slate-500"><span>Hoạt động</span><select className={crmInput} value={activity.type} onChange={event => setActivity({ ...activity, type: event.target.value })}><CrmSelectOptions values={options.types} /></select></label><label className="space-y-1 text-xs text-slate-500"><span>Thời gian dự kiến</span><input type="datetime-local" required min={crmLocalTime()} value={activity.scheduled_at} onChange={event => setActivity({ ...activity, scheduled_at: event.target.value })} className={crmInput} /></label></div>
                <label className="block space-y-1 text-xs text-slate-500"><span>Kế hoạch chăm sóc</span><textarea required maxLength={250} rows={2} value={activity.title} onChange={event => setActivity({ ...activity, title: event.target.value.slice(0, 250) })} placeholder="Ví dụ: Gửi 3 căn hộ phù hợp với ngân sách..." className={crmInput} /></label>
                <div className="flex flex-wrap items-center gap-3"><button type="submit" className={crmButton}><Plus size={14} />{busy === 'activity' ? 'Đang lưu...' : editingActivity ? 'Lưu lịch chăm sóc' : 'Thêm lịch chăm sóc'}</button>{editingActivity && <button type="button" onClick={resetActivity} className="text-xs font-semibold text-slate-500">Bỏ chỉnh sửa</button>}</div>
              </fieldset>
            </form>
            <div className="space-y-3">{detail.activities.data.length === 0 && <p className="py-5 text-center text-sm text-slate-400">Chưa có kế hoạch chăm sóc tiếp theo.</p>}{detail.activities.data.map(item => <div key={item.id} className={`rounded-lg border p-3 ${isOverdue(item) ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-600">{options.types[item.type]}</span><span className={`text-[11px] font-semibold ${item.status === 'completed' ? 'text-emerald-600' : item.status === 'cancelled' ? 'text-slate-400' : isOverdue(item) ? 'text-rose-600' : 'text-amber-600'}`}>{item.status === 'completed' ? 'Đã hoàn thành' : item.status === 'cancelled' ? 'Đã hủy' : isOverdue(item) ? 'Quá hạn' : 'Đang chờ'}</span></div>
              <p className="my-2 break-words whitespace-pre-wrap text-sm text-slate-700">{item.title}</p><p className="flex items-center gap-1 text-xs text-slate-400"><Clock size={12} />{crmDate(item.scheduled_at)}</p>
              {item.status === 'pending' ? <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" disabled={Boolean(busy) || loading} onClick={() => mutate(`complete-${item.id}`, `/activities/${item.id}/complete`, 'PATCH')} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"><Check size={13} />{busy === `complete-${item.id}` ? 'Đang lưu...' : 'Hoàn thành'}</button>
                <button type="button" disabled={Boolean(busy) || loading} onClick={() => { setEditingActivity(item.id); setActivity({ type: item.type, title: item.title, scheduled_at: crmLocalTime(new Date(item.scheduled_at)) }); document.getElementById('crm-activity-form')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }} className="rounded-md px-2 py-1.5 text-xs font-semibold text-blue-600">Sửa lịch</button>
                {cancelId === item.id ? <><button type="button" disabled={Boolean(busy) || loading} onClick={() => mutate(`cancel-${item.id}`, `/activities/${item.id}/cancel`, 'PATCH', { version: customer.version })} className="rounded-md bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-600">Xác nhận hủy lịch</button><button type="button" disabled={Boolean(busy)} onClick={() => setCancelId(null)} className="text-xs text-slate-500">Giữ lịch</button></> : <button type="button" disabled={Boolean(busy) || loading} onClick={() => setCancelId(item.id)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-400">Hủy lịch</button>}
              </div> : item.status === 'completed' && <p className="mt-2 text-[11px] text-emerald-600">Hoàn thành {crmDate(item.completed_at)}</p>}
            </div>)}</div>
            <SmallPager data={detail.activities} onPage={setActivityPage} />
          </div>
        </section>
      </div>
    </>}
  </CrmDialog>;
}
