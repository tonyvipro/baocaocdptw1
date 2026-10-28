import React, { useEffect, useId, useRef, useState } from 'react';
import { Building2, Loader2, Search, X } from 'lucide-react';
import PropertyImage from './PropertyImage';
import { nextSuggestionIndex } from '../../utils/searchSuggestions';

export default function SearchCombobox({ id, label, value, onChange, items, onSelect, loading = false, error = '', placeholder, onEnter, emptyText = 'Không có gợi ý phù hợp.', showOnEmpty = false, onClear }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = inputId + '-suggestions';
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const visible = open && (showOnEmpty || Boolean(value.trim()));
  useEffect(() => { setActive(-1); }, [value, items]);
  useEffect(() => {
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  const choose = item => { setOpen(false); setActive(-1); onSelect(item); };
  const keyDown = event => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true);
      setActive(previous => nextSuggestionIndex(previous, items.length, event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (visible && active >= 0 && items[active]) choose(items[active]);
      else { setOpen(false); onEnter?.(); }
    }
  };
  return <div ref={root} className="search-combobox relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={inputId} className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white">{label}</label>
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
      <input id={inputId} type="text" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={listId}
        aria-activedescendant={visible && active >= 0 && items[active] ? `${listId}-${active}` : undefined}
        aria-busy={loading} autoComplete="off" maxLength={250} value={value} placeholder={placeholder}
        onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value.slice(0, 250)); setOpen(true); }} onKeyDown={keyDown}
        className="w-full min-w-0 rounded-none border border-white/30 bg-black/25 py-2.5 pl-9 pr-16 text-sm text-white placeholder:text-slate-200/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
      {loading && <Loader2 aria-hidden="true" size={15} className="absolute right-9 top-1/2 -mt-2 animate-spin text-white" />}
      {value && <button type="button" aria-label={`Xóa ${label.toLowerCase()}`} onClick={() => { (onClear || (() => onChange('')))(); setOpen(true); root.current?.querySelector('input')?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20"><X size={15} /></button>}
    </div>
    {visible && <div className="absolute left-0 top-full z-[80] mt-1 max-h-[min(24rem,55dvh)] w-full overflow-y-auto border border-slate-200 bg-white text-slate-800 shadow-xl">
      <div role="status" aria-live="polite" className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">
        {loading ? 'Đang tìm gợi ý...' : error || (items.length ? 'Dự án & bất động sản gợi ý · ↑ ↓ để chọn' : emptyText)}
      </div>
      <ul id={listId} role="listbox" aria-label={`Gợi ý ${label.toLowerCase()}`}>
        {!loading && !error && items.map((item, index) => <li key={item.id} id={`${listId}-${index}`} role="option" aria-selected={active === index}
          onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(item)}
          className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-0 ${active === index ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
          {item.property ? <PropertyImage src={item.property.image} alt="" className="h-11 w-14 shrink-0 object-cover" /> : <Building2 aria-hidden="true" size={20} className="shrink-0 text-blue-600" />}
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="mt-0.5 break-words text-xs text-slate-500">{item.kind === 'project' ? 'Dự án · Xem tất cả bất động sản' : item.subtitle}</p></div>
        </li>)}
      </ul>
    </div>}
  </div>;
}
