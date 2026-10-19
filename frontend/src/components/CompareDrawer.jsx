import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
const value = v => v === null || v === undefined || v === '' ? 'Chưa cập nhật' : v;
const rows = [
  ['Mục đích', p => p.purpose === 'rent' ? 'Cho thuê' : 'Mua bán'],
  ['Mức giá', p => value(p.purpose === 'rent' ? p.price_rent_text : p.price_sale_text)],
  ['Diện tích', p => p.area > 0 ? `${Number(p.area).toLocaleString('vi-VN')} m²` : 'Chưa cập nhật'],
  ['Giá / m²', p => {
    const price = Number(p.price ?? (p.purpose === 'rent' ? p.price_rent : p.price_sale));
    return price > 0 && p.area > 0 ? `${Math.round(price / p.area).toLocaleString('vi-VN')} đ/m²${p.purpose === 'rent' ? '/tháng' : ''}` : 'Chưa cập nhật';
  }],
  ['Phòng ngủ', p => value(p.bedrooms)], ['Phòng tắm', p => value(p.bathrooms)],
  ['Loại BĐS', p => value(p.type)], ['Dự án', p => value(p.project)],
  ['Vị trí', p => value(p.address || [p.street, p.district, p.city].filter(Boolean).join(', '))],
  ['Pháp lý', p => value(p.legal_status || p.legal)], ['Nội thất', p => value(p.furniture)], ['Hướng nhà', p => value(p.direction)],
];
export default function CompareDrawer({ comparedList, onRemove, onClear, onSelectProperty }) {
  const [expanded, setExpanded] = useState(true);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  useEffect(() => { if (comparedList.length) setExpanded(true); }, [comparedList.length]);
  if (!comparedList.length) return null;
  const different = fn => new Set(comparedList.map(fn)).size > 1;
  const visibleRows = rows.filter(([, fn]) => !differencesOnly || different(fn));
  return <section id="compare-drawer" tabIndex={-1} aria-label="So sánh bất động sản" onFocus={e => { if (e.target === e.currentTarget) setExpanded(true); }} onKeyDown={e => { if (e.key === 'Escape') setExpanded(false); }} className="fixed bottom-0 inset-x-0 z-40 rounded-t-3xl border border-slate-200 bg-white shadow-2xl focus:outline-none">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="comparison-content" className="flex items-center gap-3 text-left">
          <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><SlidersHorizontal size={20} /></span>
          <span><span className="block font-bold text-slate-900">So sánh bất động sản <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs">{comparedList.length}/4</span></span><span className="text-xs text-slate-500">Đặt cạnh nhau, chọn căn phù hợp</span></span><ChevronDown size={18} className={expanded ? '' : 'rotate-180'} />
        </button>
        <div className="flex items-center gap-4 text-xs font-semibold">
          {expanded && <label className="flex items-center gap-2"><input type="checkbox" checked={differencesOnly} onChange={e => setDifferencesOnly(e.target.checked)} className="accent-blue-600" />Chỉ hiện khác biệt</label>}
          <button onClick={onClear} className="text-red-600">Xóa tất cả</button>
        </div>
      </div>
      {expanded && <div id="comparison-content" className="max-h-[65vh] overflow-auto overscroll-contain pb-5">
        {comparedList.length === 1 && <p className="mb-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Chọn thêm bất động sản để đối chiếu. Tối đa 4 tin.</p>}
        {new Set(comparedList.map(p => p.purpose)).size > 1 && <p className="mb-3 text-xs text-amber-700">Đang so sánh tin bán và cho thuê. Giá thuê được tính theo tháng.</p>}
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Đối chiếu thông số bất động sản</caption>
          <thead><tr><th scope="col" className="sticky left-0 z-10 min-w-[120px] bg-white p-3 text-left text-xs text-slate-500">TIÊU CHÍ</th>
            {comparedList.map(p => <th scope="col" key={p.code || p.id} className="min-w-[220px] max-w-[300px] p-3 text-left align-top">
              <div className="relative mb-3"><img src={p.image} alt="" className="h-28 w-full rounded-xl bg-slate-100 object-cover" /><button aria-label={`Bỏ so sánh ${p.title}`} onClick={() => onRemove(p)} className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow"><X size={14} /></button></div>
              <p className="text-xs text-blue-600">{p.code}</p><p className="mt-1 line-clamp-2 font-semibold text-slate-900">{p.title || p.project}</p>
              <button onClick={() => onSelectProperty(p)} className="mt-2 text-xs text-blue-600">Xem chi tiết →</button>
            </th>)}
          </tr></thead>
          <tbody>{visibleRows.map(([label, fn]) => <tr key={label} className={different(fn) ? 'bg-blue-50/60' : 'bg-white'}>
            <th scope="row" className="sticky left-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-3.5 text-left text-xs font-medium text-slate-500">{label}</th>
            {comparedList.map(p => <td key={p.code || p.id} className={`border-b border-slate-100 px-3 py-3.5 ${label === 'Mức giá' ? 'font-bold text-red-600' : 'text-slate-700'}`}>{fn(p)}</td>)}
          </tr>)}</tbody>
        </table>
        {differencesOnly && !visibleRows.length && <p className="py-5 text-center text-sm text-slate-500">Các thông số hiện có giống nhau.</p>}
        <p className="mt-3 text-xs text-slate-400">Hàng nền xanh thể hiện thông số khác nhau giữa các tin.</p>
      </div>}
    </div>
  </section>;
}
