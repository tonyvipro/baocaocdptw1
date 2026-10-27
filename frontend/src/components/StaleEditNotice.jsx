import { useEffect, useState } from 'react';
import { STALE_EDIT_EVENT } from '../utils/apiSessionGuard';

export default function StaleEditNotice() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(STALE_EDIT_EVENT, lock);
    return () => window.removeEventListener(STALE_EDIT_EVENT, lock);
  }, []);
  if (!locked) return null;
  return <div className="app-dialog-layer fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <section role="alertdialog" aria-modal="true" aria-labelledby="stale-edit-title" className="form-surface w-full max-w-md rounded-none bg-white p-6 text-slate-800 shadow-xl">
      <h2 id="stale-edit-title" className="text-lg font-bold">Dữ liệu đã thay đổi</h2>
      <p className="mt-3 text-sm leading-6">Bản dữ liệu này đã cũ. Hệ thống đã chặn ghi đè; hãy tải lại trang để xem thông tin mới nhất trước khi sửa tiếp.</p>
      <button autoFocus type="button" onClick={() => window.location.reload()} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Tải lại dữ liệu</button>
    </section>
  </div>;
}
