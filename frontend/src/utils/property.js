export const normalizeSearch = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function matchesPrice(property, range) {
  if (range === 'all') return true;
  const rent = range.startsWith('rent-');
  if (property.purpose !== (rent ? 'rent' : 'sale')) return false;
  const price = Number(rent ? property.price_rent : property.price_sale);
  if (!Number.isFinite(price) || price <= 0) return false;
  const ranges = {
    'under-3b': [0, 3e9], '3b-6b': [3e9, 6e9], '6b-15b': [6e9, 15e9],
    '15b-30b': [15e9, 30e9], 'above-30b': [30e9, Infinity],
    'rent-under-15m': [0, 15e6], 'rent-15m-30m': [15e6, 30e6],
    'rent-above-30m': [30e6, Infinity],
  };
  const bounds = ranges[range];
  return Boolean(bounds && price >= bounds[0] && price < bounds[1]);
}

export function validCoordinates(property) {
  return [property.lat, property.lng].every(v => v !== null && v !== undefined && String(v).trim() !== '' && Number.isFinite(Number(v)))
    && Math.abs(Number(property.lat)) <= 90 && Math.abs(Number(property.lng)) <= 180;
}

export function readPropertyList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value.filter(p => p && typeof p === 'object' && typeof p.code === 'string' && p.code) : [];
  } catch { return []; }
}
