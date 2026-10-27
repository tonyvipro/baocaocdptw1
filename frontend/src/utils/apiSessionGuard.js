import axios from 'axios';

export const STALE_EDIT_EVENT = '3tv:stale-edit';
export function installApiSessionGuard(target = window) {
  const originalFetch = target.fetch;
  let locked = false;
  const stale = () => { locked = true; target.dispatchEvent(new Event(STALE_EDIT_EVENT)); };
  const isApi = url => { const parsed = new URL(url, target.location.href); return parsed.origin === target.location.origin && parsed.pathname.startsWith('/api/'); };
  target.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    if (!isApi(url)) return originalFetch.call(target, input, options);
    const method = (options.method || input.method || 'GET').toUpperCase();
    if (locked && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return new Response(JSON.stringify({ code: 'STALE_VERSION', message: 'Vui lòng tải lại trang trước khi sửa dữ liệu.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    const headers = new Headers(options.headers || input.headers);
    const token = target.localStorage.getItem('3tv_token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    const response = await originalFetch.call(target, input, { ...options, headers, cache: method === 'GET' ? 'no-store' : options.cache });
    if (response.status === 409 && (await response.clone().json().catch(() => ({}))).code === 'STALE_VERSION') stale();
    return response;
  };
  const interceptor = axios.interceptors.response.use(response => response, error => {
    if (error.response?.status === 409 && error.response?.data?.code === 'STALE_VERSION') stale();
    return Promise.reject(error);
  });
  const requestInterceptor = axios.interceptors.request.use(config => {
    if (locked && isApi(config.url) && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
      return Promise.reject(new Error('Vui lòng tải lại trang trước khi sửa dữ liệu.'));
    }
    return config;
  });
  return () => { target.fetch = originalFetch; axios.interceptors.response.eject(interceptor); axios.interceptors.request.eject(requestInterceptor); };
}
