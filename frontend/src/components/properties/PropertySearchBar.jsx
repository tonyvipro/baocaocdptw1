import React from 'react';
import SearchCombobox from './SearchCombobox';

export default function PropertySearchBar({ value, onChange, suggestions = [], onSelect, isLoading = false, error = '', searchMode = 'smart' }) {
  const isSmart = searchMode === 'smart';
  const label = isSmart ? 'Tìm kiếm thông minh' : 'Tìm kiếm thường';
  const placeholder = isSmart ? 'Tên dự án, địa chỉ, mã tin... (Elasticsearch)' : 'Tên dự án, địa chỉ, mã tin...';

  return <SearchCombobox id="smart-property-query" label={label} value={value} onChange={onChange}
    items={suggestions} onSelect={onSelect} loading={isLoading} error={error} placeholder={placeholder}
    onEnter={() => document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' })} />;
}
