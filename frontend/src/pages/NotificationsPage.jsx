import ActivityLogDetails from '../components/ActivityLogDetails';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bell, CheckCheck, Download, Filter, RefreshCw, X } from 'lucide-react';
import { downloadActivityLogs, notificationDate, notificationDestination, notificationRequest } from '../services/notifications';
import { broadcastDataChange, subscribeDataChange } from '../services/tabSync';

const blankPage = { data: [], meta: { total: 0, current_page: 1, last_page: 1, from: 0, to: 0 } };

export function ActivityAction({ destination }) {
  const link = notificationDestination(destination);
  return link ? <a href={link.url} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">{link.label}<ArrowUpRight aria-hidden="true" size={13} /></a> : <span className="text-slate-400">—</span>;
}

function Pager({ page, onPage, loading }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
    <span>Hiển thị {page.meta.from || 0}-{page.meta.to || 0} trong tổng số {page.meta.total} bản ghi</span>
    {page.meta.last_page > 1 && <div className="flex items-center gap-3"><button type="button" disabled={loading || page.meta.current_page <= 1} onClick={() => onPage(page.meta.current_page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Trước</button><span>{page.meta.current_page}/{page.meta.last_page}</span><button type="button" disabled={loading || page.meta.current_page >= page.meta.last_page} onClick={() => onPage(page.meta.current_page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Sau</button></div>}
  </div>;
}

export default function NotificationsPage({ currentUser, onBack, onLogin, embedded = false }) {
  const [data, setData] = useState({ notifications: blankPage, logs: blankPage, unread_count: 0, log_scope: 'personal' });
  const [notificationPage, setNotificationPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Bộ lọc nhật ký
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterActorId, setFilterActorId] = useState('');

  const buildQuery = (extra = {}) => {
    const query = new URLSearchParams({
      notification_page: notificationPage,
      log_page: logPage,
      ...extra,
    });
    if (filterStartDate) query.set('start_date', filterStartDate);
    if (filterEndDate) query.set('end_date', filterEndDate);
    if (filterAction) query.set('action', filterAction);
    if (filterActorId) query.set('actor_id', filterActorId);
    return query.toString();
  };

  useEffect(() => {
    const controller = new AbortController();
    if (!currentUser?.id) { setLoading(false); setData({ notifications: blankPage, logs: blankPage, unread_count: 0, log_scope: 'personal' }); return; }
    setLoading(true); setError('');
    const queryStr = buildQuery();
    notificationRequest('?' + queryStr, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (notificationPage > result.notifications.meta.last_page) setNotificationPage(result.notifications.meta.last_page);
      if (logPage > result.logs.meta.last_page) setLogPage(result.logs.meta.last_page);
      setData(result);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [currentUser?.id, notificationPage, logPage, revision, filterStartDate, filterEndDate, filterAction, filterActorId]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const refresh = () => { if (document.visibilityState !== 'hidden') setRevision(value => value + 1); };
    const timer = setInterval(refresh, 15000);
    const unsubscribe = subscribeDataChange(event => { if (event.entity === 'notifications') refresh(); });
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); unsubscribe(); document.removeEventListener('visibilitychange', refresh); };
  }, [currentUser?.id]);

  const markRead = async () => {
    setBusy('read'); setError(''); setNotice('');
    try {
      const result = await notificationRequest('/read-all', { method: 'PATCH' });
      setData(previous => ({ ...previous, unread_count: result.unread_count, notifications: { ...previous.notifications, data: previous.notifications.data.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })) } }));
      setNotice(result.message); setRevision(value => value + 1);
      window.dispatchEvent(new CustomEvent('3tv:notifications-changed'));
      broadcastDataChange({ entity: 'notifications', action: 'read-all' });
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  const download = async () => {
    setBusy('download'); setError(''); setNotice('');
    try {
      const file = await downloadActivityLogs(buildQuery());
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = file.filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Đã tải xuống nhật ký hoạt động.');
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  const resetFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterAction('');
    setFilterActorId('');
    setLogPage(1);
  };

  const hasActiveFilters = Boolean(filterStartDate || filterEndDate || filterAction || filterActorId);

  const table = (title, headings, page, renderRow, setPage, filterNode = null) => <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {filterNode}
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm" aria-label={title} aria-busy={loading}>
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>{headings.map(heading => <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{loading && !page.data.length ? Array.from({ length: 3 }, (_, index) => <tr key={index} className="animate-pulse">{headings.map(heading => <td key={heading} className="px-4 py-4"><div className="h-3 rounded bg-slate-100" /></td>)}</tr>) : page.data.length ? page.data.map(renderRow) : <tr><td colSpan={headings.length} className="px-4 py-8 text-center text-slate-400">{error ? 'Chưa tải được dữ liệu.' : 'Chưa có dữ liệu.'}</td></tr>}</tbody>
    </table></div><Pager page={page} onPage={setPage} loading={loading} />
  </section>;

  const logFilters = (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5">
        <label htmlFor="log-start-date" className="text-slate-500">Từ:</label>
        <input
          id="log-start-date"
          type="date"
          value={filterStartDate}
          onChange={e => { setFilterStartDate(e.target.value); setLogPage(1); }}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label htmlFor="log-end-date" className="text-slate-500">Đến:</label>
        <input
          id="log-end-date"
          type="date"
          value={filterEndDate}
          onChange={e => { setFilterEndDate(e.target.value); setLogPage(1); }}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <select
        aria-label="Loại thao tác"
        value={filterAction}
        onChange={e => { setFilterAction(e.target.value); setLogPage(1); }}
        className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Tất cả thao tác</option>
        <option value="LOGIN">Đăng nhập</option>
        <option value="LOGOUT">Đăng xuất</option>
        <option value="PROFILE_UPDATE">Cập nhật hồ sơ</option>
        <option value="CREATE">Tạo mới</option>
        <option value="UPDATE">Cập nhật</option>
        <option value="DELETE">Xóa</option>
        <option value="CONTRACT_SIGN">Ký hợp đồng</option>
        <option value="CUSTOMER_CREATE">Thêm khách hàng</option>
        <option value="DEMAND_CREATE">Thêm nhu cầu</option>
      </select>
      {data.log_scope === 'system' && (
        <input
          type="text"
          placeholder="Mã User (Admin)..."
          value={filterActorId}
          onChange={e => { setFilterActorId(e.target.value); setLogPage(1); }}
          className="w-28 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
          title="Xóa bộ lọc"
        >
          <X size={12} /> Xóa lọc
        </button>
      )}
    </div>
  );

  return <div className={embedded ? 'space-y-5' : 'giang-workspace mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8'}>
    <header className="giang-page-heading flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl"><Bell size={22} className="shrink-0 text-red-600" />THÔNG BÁO & NHẬT KÝ</h1>
        <p className="mt-1 text-xs text-slate-500">Thông báo hệ thống và lịch sử thao tác {data.log_scope === 'system' ? 'của người dùng' : 'của bạn'}.</p>
      </div>
      <div className="flex gap-2">
        {onBack && <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><ArrowLeft size={14} />Quay lại</button>}
        <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading || !currentUser} aria-label="Tải lại thông báo và nhật ký" className="rounded border border-slate-300 bg-white p-2 text-slate-500 disabled:opacity-40"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
    </header>
    {!currentUser ? <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Vui lòng đăng nhập để xem thông báo và nhật ký.{onLogin && <button type="button" onClick={onLogin} className="ml-2 font-semibold text-red-600">Đăng nhập</button>}</div> : <>
      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button type="button" onClick={() => setRevision(value => value + 1)} className="font-semibold underline">Thử lại</button></div>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</p>}
      {table('Thông báo Mới', ['Ngày', 'Loại thông báo', 'Nội dung', 'Trạng thái', 'Thao tác'], data.notifications, item => <tr key={item.id} className={item.read_at ? '' : 'bg-blue-50/40'}><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{notificationDate(item.created_at)}</td><td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700">{item.category}</td><td className="min-w-[260px] break-words px-4 py-3 text-slate-700">{item.message}</td><td className="whitespace-nowrap px-4 py-3 text-xs">{item.read_at ? <span className="text-slate-400">Đã đọc</span> : <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Chưa đọc</span>}</td><td className="px-4 py-3"><ActivityAction destination={item.destination} /></td></tr>, setNotificationPage)}
      {table('Nhật ký Hoạt động', ['Ngày', 'Người dùng', 'Hoạt động', 'Chi tiết', 'Thao tác'], data.logs, item => <tr key={item.id}><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{notificationDate(item.created_at)}</td><td className="break-words px-4 py-3 font-medium text-slate-700">{item.user}</td><td className="px-4 py-3 text-slate-700">{item.action}</td><td className="min-w-[220px] break-words px-4 py-3 text-slate-600"><ActivityLogDetails item={item} /></td><td className="px-4 py-3"><ActivityAction destination={item.destination} /></td></tr>, setLogPage, logFilters)}
      <footer className="flex flex-wrap gap-3"><button type="button" onClick={markRead} disabled={Boolean(busy) || loading || !data.unread_count} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"><CheckCheck size={15} />{busy === 'read' ? 'Đang cập nhật...' : 'Đánh dấu tất cả là đã đọc'}</button><button type="button" onClick={download} disabled={Boolean(busy) || loading || Boolean(error)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download size={15} />{busy === 'download' ? 'Đang tải...' : 'Tải xuống Nhật ký'}</button></footer>
      <p className="text-[11px] text-slate-400">Dữ liệu tự cập nhật mỗi 15 giây · Giờ Việt Nam (UTC+7). Nhật ký tải xuống gồm toàn bộ dữ liệu trong phạm vi quyền truy cập.</p>
    </>}
  </div>;
}
