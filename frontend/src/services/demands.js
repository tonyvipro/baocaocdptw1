export async function demandRequest(path = '', { signal, method = 'GET', data, timeoutMs = 30000 } = {}) {
  let token;
  try { token = localStorage.getItem('3tv_token'); } catch { /* Session cookies remain available. */ }
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel(); else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const failure = (message, status = 0) => Object.assign(new Error(message), { status });
  const timeoutMessage = 'Máy chủ nhu cầu phản hồi quá lâu. Vui lòng kiểm tra backend và thử lại.';
  try {
    let response;
    try {
      response = await fetch('/api/demands' + path, {
        method, signal: controller.signal, credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw failure(timedOut ? timeoutMessage : 'Không kết nối được máy chủ nhu cầu. Vui lòng kiểm tra backend và thử lại.');
    }
    if (response.status === 401) window.dispatchEvent(new CustomEvent('3tv:auth-required'));
    let payload;
    try { payload = await response.json(); }
    catch (error) {
      if (signal?.aborted) throw error;
      if (timedOut) throw failure(timeoutMessage);
      const message = response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : response.status >= 500 ? `Không nhận được dữ liệu từ máy chủ nhu cầu (HTTP ${response.status}). Vui lòng kiểm tra backend và thử lại.`
          : `Máy chủ chưa trả dữ liệu nhu cầu hợp lệ (HTTP ${response.status}). Vui lòng thử lại.`;
      throw failure(message, response.status);
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw failure('Máy chủ chưa trả dữ liệu nhu cầu hợp lệ. Vui lòng thử lại.', response.status);
    if (!response.ok) {
      const error = failure(typeof payload.message === 'string' ? payload.message : 'Không thể xử lý nhu cầu.', response.status);
      error.fields = payload.errors || {};
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export const demandDigits = value => value.replace(/[^0-9]/g, '').slice(0, 15);
export function demandBudget(min, max) {
  const from = Number(min).toLocaleString('vi-VN');
  return Number(min) === Number(max) ? from + ' VNĐ' : from + ' – ' + Number(max).toLocaleString('vi-VN') + ' VNĐ';
}
export const demandStatusStyles = {
  processing: 'border-amber-200 bg-amber-50 text-amber-700',
  consulting: 'border-blue-200 bg-blue-50 text-blue-700',
  matched: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed: 'border-slate-200 bg-slate-100 text-slate-600',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};
