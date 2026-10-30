import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationRequest } from '../services/notifications';
import { subscribeDataChange } from '../services/tabSync';

export default function NotificationBell({ currentUser, onOpen }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!currentUser?.id) return;
    let pending = false, stopped = false;
    let controller;
    const refresh = async () => {
      if (pending || stopped || document.visibilityState === 'hidden') return;
      pending = true; controller = new AbortController();
      try {
        const data = await notificationRequest('/unread-count', { signal: controller.signal, silentAuth: true });
        if (!stopped) setCount(data.unread_count);
      } catch { /* A background badge request should not open a login popup. */ }
      finally { pending = false; }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    const unsubscribe = subscribeDataChange(event => { if (event.entity === 'notifications') refresh(); });
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('3tv:notifications-changed', refresh);
    return () => {
      stopped = true; controller?.abort(); clearInterval(timer); unsubscribe();
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('3tv:notifications-changed', refresh);
    };
  }, [currentUser?.id]);
  return <button type="button" onClick={onOpen} title="Thông báo & Nhật ký" aria-label={'Thông báo & Nhật ký' + (count ? ', ' + count + ' thông báo chưa đọc' : '')}
    className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
    <Bell size={20} />{count > 0 && <span aria-hidden="true" className="absolute right-0 top-0 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{count > 99 ? '99+' : count}</span>}
  </button>;
}
