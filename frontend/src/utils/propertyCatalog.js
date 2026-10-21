export const normalizeText = value => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');

export function availableRecentViews(history, catalog) {
  const available = new Map(filterCatalog(catalog).map(property => [property.code, property]));
  return history.filter(item => available.has(item.code)).map(item => ({ ...available.get(item.code), viewed_at: item.viewed_at }));
}

export function propertyPrice(p) {
  const value = Number(p.price ?? (p.purpose === 'rent' ? p.price_rent : p.price_sale));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function inRange(value, range, prefix = '') {
  if (!range || range === 'all') return true;
  if (value === null || !Number.isFinite(value) || value <= 0) return false;
  if (range.startsWith(prefix)) {
    const [low, high] = range.slice(prefix.length).split('-').map(Number);
    return Number.isFinite(low) && (Number.isFinite(high) || high === Infinity) && low >= 0 && high >= low && value >= low && value <= high;
  }
  return false;
}

export function priceMatches(p, range) {
  if (!range || range === 'all') return true;
  const price = propertyPrice(p);
  if (range.startsWith('custom:')) return inRange(price, range, 'custom:');
  const rent = range.startsWith('rent-');
  if (p.purpose !== (rent ? 'rent' : 'sale') || price === null) return false;
  const key = rent ? range.slice(5) : range;
  const unit = rent ? 1e6 : 1e9;
  const match = /^(under|above)-(\d+)[bm]$/.exec(key);
  if (match) return match[1] === 'under' ? price < Number(match[2]) * unit : price >= Number(match[2]) * unit;
  const between = /^(\d+)[bm]-(\d+)[bm]$/.exec(key);
  return Boolean(between && price >= Number(between[1]) * unit && price < Number(between[2]) * unit);
}

export function areaMatches(p, range) {
  if (!range || range === 'all') return true;
  const area = Number(p.area);
  if (!Number.isFinite(area) || area <= 0) return false;
  if (range.startsWith('custom-area:')) return inRange(area, range, 'custom-area:');
  const match = /^(under|above)-(\d+)$/.exec(range);
  if (match) return match[1] === 'under' ? area < Number(match[2]) : area >= Number(match[2]);
  const between = /^(\d+)-(\d+)$/.exec(range);
  return Boolean(between && area >= Number(between[1]) && area < Number(between[2]));
}

export function filterCatalog(properties, f = {}) {
  const tokens = normalizeText(f.search).split(' ').filter(Boolean);
  const typeGroups = {
    'can-ho': ['can ho', 'chung cu', 'apartment'], 'nha-pho': ['nha pho', 'lien ke', 'nha rieng', 'townhouse'],
    'biet-thu': ['biet thu', 'villa'], 'dat-nen': ['dat'], 'mat-bang': ['mat bang', 'shophouse', 'kinh doanh'],
  };
  const result = properties.filter(p => {
    if (!p || (p.status !== undefined && ![1, '1', 'available'].includes(p.status)) || p.deleted_at) return false;
    if (p.expire_date && new Date(p.expire_date.replace(' ', 'T')).getTime() < Date.now()) return false;
    for (const field of ['purpose', 'project', 'city', 'developer']) {
      if (f[field] && f[field] !== 'all' && p[field] !== f[field]) return false;
    }
    if (!tokens.every(token => ['title', 'project', 'street', 'address', 'district', 'city', 'developer', 'code', 'type'].some(field => normalizeText(p[field]).includes(token)))) return false;
    if (f.type && f.type !== 'all') {
      const type = normalizeText(p.type);
      const selected = normalizeText(f.type);
      const aliases = { 'can ho': 'can-ho', 'can ho cao cap': 'can-ho', 'nha pho': 'nha-pho', 'nha pho / lien ke': 'nha-pho', 'biet thu': 'biet-thu', 'biet thu nghi duong': 'biet-thu', 'dat nen': 'dat-nen', 'dat nen du an': 'dat-nen', 'mat bang': 'mat-bang', 'mat bang kinh doanh': 'mat-bang' };
      const group = typeGroups[aliases[selected] || selected];
      if (group ? !group.some(value => type.includes(value)) : !type.includes(selected)) return false;
    }
    if (f.bedrooms && f.bedrooms !== 'all') {
      const bedrooms = Number(p.bedrooms), selected = Number(f.bedrooms);
      if (!Number.isFinite(bedrooms) || (selected === 4 ? bedrooms < 4 : bedrooms !== selected)) return false;
    }
    return priceMatches(p, f.price) && areaMatches(p, f.area);
  });
  return result.sort((a, b) => {
    if (['price-asc', 'price-desc'].includes(f.sort)) {
      const ap = propertyPrice(a), bp = propertyPrice(b);
      if (ap === null || bp === null) return ap === bp ? 0 : ap === null ? 1 : -1;
      return f.sort === 'price-asc' ? ap - bp : bp - ap;
    }
    if (f.sort === 'area-asc') return Number(a.area || 0) - Number(b.area || 0);
    if (f.sort === 'area-desc') return Number(b.area || 0) - Number(a.area || 0);
    const time = p => Date.parse(p.created_at) || Number(p.id) || 0;
    if (f.sort === 'newest') return time(b) - time(a);
    if (f.sort === 'oldest') return time(a) - time(b);
    return 0;
  });
}

let pending;
export function loadCatalog(client) {
  if (pending) return pending;
  pending = (async () => {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.get(`/api/properties?_t=${Date.now()}`, { timeout: 20000, headers: { Accept: 'application/json' } });
        const data = Array.isArray(response.data) ? response.data : response.data?.data;
        if (!Array.isArray(data)) throw new Error('Phản hồi danh sách bất động sản không hợp lệ.');
        return { data, source: 'backend' };
      } catch (error) { lastError = error; }
    }
    throw new Error('Không tải được dữ liệu bất động sản từ máy chủ. Vui lòng thử lại.', { cause: lastError });
  })().finally(() => { pending = undefined; });
  return pending;
}

export function watchCatalog(reload, intervalMs = 5000) {
  const refresh = () => { if (document.visibilityState !== 'hidden') reload({ silent: true }); };
  const originalFetch = window.fetch;
  const observedFetch = async (...args) => {
    const response = await originalFetch.apply(window, args);
    const request = args[0];
    const method = String(args[1]?.method || request?.method || 'GET').toUpperCase();
    const url = new URL(request instanceof URL ? request.href : typeof request === 'string' ? request : request.url, window.location.href);
    if (response.status === 401 && url.origin === window.location.origin && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      window.dispatchEvent(new Event('3tv:auth-required'));
    }
    if (response.ok && url.origin === window.location.origin && /^\/api\/(properties|property-types)(?:\/|$)/.test(url.pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      window.dispatchEvent(new Event('3tv:properties-changed'));
    }
    return response;
  };
  window.fetch = observedFetch;
  window.addEventListener('focus', refresh);
  window.addEventListener('online', refresh);
  window.addEventListener('3tv:properties-changed', refresh);
  document.addEventListener('visibilitychange', refresh);
  const timer = setInterval(refresh, intervalMs);
  return () => {
    clearInterval(timer);
    if (window.fetch === observedFetch) window.fetch = originalFetch;
    window.removeEventListener('focus', refresh);
    window.removeEventListener('online', refresh);
    window.removeEventListener('3tv:properties-changed', refresh);
    document.removeEventListener('visibilitychange', refresh);
  };
}

export async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không lưu được thay đổi trên máy chủ.');
  return data;
}

export function safePropertyList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data.filter(p => p && typeof p === 'object' && typeof p.code === 'string' && p.code) : [];
  } catch { return []; }
}

export function coordinatesValid(p) {
  return [p.lat, p.lng].every(value => value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value)))
    && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180;
}

export async function shareListing(property) {
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.set('property', property.code || property.id);
  try {
    await navigator.clipboard.writeText(url.toString());
    return true;
  } catch {
    window.prompt('Sao chép liên kết bất động sản:', url.toString());
    return false;
  }
}
