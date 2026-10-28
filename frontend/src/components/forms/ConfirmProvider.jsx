import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

export default function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const pending = useRef(null);
  const cancelButton = useRef(null);
  const ask = useCallback(options => {
    if (pending.current) return Promise.resolve(false);
    return new Promise(resolve => { pending.current = resolve; setDialog(options); });
  }, []);
  const finish = value => { const resolve = pending.current; pending.current = null; setDialog(null); resolve?.(value); };
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement;
    const layers = [...document.querySelectorAll('.app-dialog-layer, .admin-page-content')];
    const states = layers.map(layer => [layer, layer.inert, layer.getAttribute('aria-hidden')]);
    layers.forEach(layer => { layer.inert = true; layer.setAttribute('aria-hidden', 'true'); layer.setAttribute('data-suspended', 'true'); });
    document.body.setAttribute('data-confirming', 'true');
    cancelButton.current?.focus();
    return () => {
      document.body.removeAttribute('data-confirming');
      states.forEach(([layer, inert, hidden]) => { layer.inert = inert; layer.removeAttribute('data-suspended'); if (hidden === null) layer.removeAttribute('aria-hidden'); else layer.setAttribute('aria-hidden', hidden); });
      previous?.focus?.();
    };
  }, [dialog]);
  useEffect(() => () => { pending.current?.(false); }, []);
  return <ConfirmContext.Provider value={ask}>{children}{dialog && createPortal(
    <div className="confirmation-layer fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onKeyDown={event => {
      if (event.key === 'Escape') finish(false);
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll('button')];
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" className="form-surface giang-dialog w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <AlertTriangle size={24} className={dialog.danger ? 'text-red-600' : 'text-blue-600'} />
        <h2 id="confirmation-title" className="mt-3 text-lg font-bold text-slate-900">{dialog.title || 'Xác nhận thay đổi'}</h2>
        <p id="confirmation-description" className="mt-2 break-words text-sm leading-6 text-slate-600">{dialog.message || 'Bạn có muốn lưu các thay đổi này?'}</p>
        <footer className="mt-6 flex flex-wrap justify-end gap-2">
          <button ref={cancelButton} type="button" onClick={() => finish(false)} className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Quay lại</button>
          <button type="button" onClick={() => finish(true)} className={`giang-primary px-4 py-2.5 text-sm font-semibold text-white ${dialog.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{dialog.confirmLabel || 'Xác nhận lưu'}</button>
        </footer>
      </section>
    </div>, document.body)}</ConfirmContext.Provider>;
}
