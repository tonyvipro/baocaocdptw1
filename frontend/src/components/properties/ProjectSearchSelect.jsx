import React, { useEffect, useMemo, useState } from 'react';
import SearchCombobox from './SearchCombobox';
import { projectSuggestions } from '../../utils/searchSuggestions';

export default function ProjectSearchSelect({ projects, value, onChange }) {
  const [query, setQuery] = useState(value === 'all' ? '' : value);
  useEffect(() => { setQuery(value === 'all' ? '' : value); }, [value]);
  const items = useMemo(() => projectSuggestions(projects, query), [projects, query]);
  return <SearchCombobox label="Dự án trọng điểm" value={query} onChange={text => { setQuery(text); if (!text) onChange('all'); }}
    items={items} onSelect={item => { setQuery(item.value); onChange(item.value); }} showOnEmpty
    onEnter={() => { if (items[0]) { setQuery(items[0].value); onChange(items[0].value); } }}
    onClear={() => { setQuery(''); onChange('all'); }} placeholder="Gõ tên hoặc chọn dự án..." emptyText="Không tìm thấy dự án phù hợp." />;
}
