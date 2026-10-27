export function notificationHeaders() {
  let token;
  try { token = localStorage.getItem('3tv_token'); } catch { /* Cookie authentication remains available. */ }
  return { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) };
}

export async function notificationRequest(path = '', { method = 'GET', signal, silentAuth = false } = {}) {
  const response = await fetch('/api/notifications' + path, { method, signal, credentials: 'same-origin', headers: notificationHeaders() });
  let data;
  try { data = await response.json(); } catch { throw new Error('Máy chủ chưa trả dữ liệu thông báo hợp lệ.'); }
  if (!response.ok) {
    if (response.status === 401 && !silentAuth) window.dispatchEvent(new CustomEvent('3tv:auth-required'));
    const error = new Error(data.message || 'Không thể tải thông báo và nhật ký.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function downloadActivityLogs() {
  const response = await fetch('/api/notifications/logs/download', { credentials: 'same-origin', headers: notificationHeaders() });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/csv')) {
    if (response.status === 401) window.dispatchEvent(new CustomEvent('3tv:auth-required'));
    throw new Error('Không thể tải xuống nhật ký. Vui lòng kiểm tra phiên đăng nhập và thử lại.');
  }
  const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'nhat-ky-hoat-dong.csv';
  return { blob: await response.blob(), filename };
}

export const notificationDate = value => value ? new Date(value).toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

export function notificationDestination(destination) {
  const url = destination?.url;
  return typeof url === 'string' && (url === '?modal=profile' || /^#(?:admin\/[a-z-]+(?:[/?]|$)|my-contracts(?:\/\d+)?$|my-invoices$)/.test(url))
    ? { url, label: destination.label || 'Xem dữ liệu' } : null;
}
