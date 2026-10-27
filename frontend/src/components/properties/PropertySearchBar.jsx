import React from 'react';
import SearchCombobox from './SearchCombobox';

export default function PropertySearchBar({ value, onChange, suggestions = [], onSelect, isLoading = false, error = '' }) {
  return <SearchCombobox id="smart-property-query" label="Tìm kiếm thông minh" value={value} onChange={onChange}
    items={suggestions} onSelect={onSelect} loading={isLoading} error={error} placeholder="Tên dự án, địa chỉ, mã tin..."
    onEnter={() => document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' })} />;
}
