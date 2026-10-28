import React, { useEffect, useId, useRef } from 'react';
import { X, ClipboardList } from 'lucide-react';

export default function CrmDialog({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);
  const keyDown = event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = [...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(node => node.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
  };
  return <div className="app-dialog-layer fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={keyDown} className={`form-surface giang-dialog flex min-w-0 max-h-[94dvh] w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl outline-none ${wide ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <header className="giang-dialog-heading flex shrink-0 items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/5"><ClipboardList size={21} /></span>
          <div><div className="giang-eyebrow">3TV LAND / QUẢN LÝ</div><h2 id={titleId}>{title}</h2>{subtitle && <p className="mt-1 text-xs">{subtitle}</p>}</div>
        </div>
        <button type="button" aria-label="Đóng cửa sổ" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </header>
      <div className="giang-dialog-body overflow-y-auto p-5 sm:p-6">{children}</div>
    </section>
  </div>;
}

export const crmInput = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';
export const crmButton = 'giang-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

export function CrmError({ error }) {
  return error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null;
}

export function CrmSelectOptions({ values = {} }) {
  return Object.entries(values).map(([value, label]) => <option key={value} value={value}>{label}</option>);
}
