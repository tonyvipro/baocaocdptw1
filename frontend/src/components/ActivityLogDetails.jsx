import React from 'react';

export default function ActivityLogDetails({ item }) {
  if (!Array.isArray(item.changes) || !item.changes.length) return <span>{item.details}</span>;
  return <div className="min-w-[240px] max-w-xl space-y-2">
    <p className="text-xs font-semibold text-slate-500">{item.subject || 'Thông tin đã thay đổi'}</p>
    <dl className="space-y-2">{item.changes.map(change => <div key={change.field} className="border-l-2 border-blue-200 pl-2">
      <dt className="text-xs font-semibold text-slate-700">{change.label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-5">
        <span className="text-slate-500">{change.before}</span><span aria-label="thành" className="mx-1 text-blue-600">→</span><strong className="font-medium text-slate-900">{change.after}</strong>
      </dd>
    </div>)}</dl>
  </div>;
}
