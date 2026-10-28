export async function searchProperties(query, { page = 1, catalog = false, signal, fetcher = fetch } = {}) {
  const params = new URLSearchParams(catalog
    ? { q: query.trim(), catalog: '1' }
    : { q: query.trim(), page: String(page), per_page: '8' });
  const response = await fetcher(`/api/search/properties?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Không thể tải kết quả tìm kiếm. Vui lòng thử lại.');
  }
  if (!Array.isArray(payload?.data) || !payload?.meta || (catalog && !payload.data.every(Number.isInteger))) {
    throw new Error('Máy chủ trả về kết quả tìm kiếm không hợp lệ.');
  }
  return payload;
}

export function rankSearchCatalog(properties, ids) {
  const catalog = new Map(properties.map(property => [String(property.id), property]));
  return ids.map(id => catalog.get(String(id))).filter(Boolean);
}
