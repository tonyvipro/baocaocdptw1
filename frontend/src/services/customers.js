export async function customerRequest(path = '', { signal, method = 'GET', data } = {}) {
  let token;
  try { token = localStorage.getItem('3tv_token'); } catch { /* Session cookies still work when storage is unavailable. */ }
  const response = await fetch(`/api/customers${path}`, {
    method, signal, credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error('Máy chủ chưa trả dữ liệu hợp lệ. Vui lòng thử lại.'); }
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new CustomEvent('3tv:auth-required'));
    const error = new Error(payload.message || 'Không thể xử lý yêu cầu khách hàng.');
    error.fields = payload.errors || {};
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const crmDate = (value, withTime = true) => value
  ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
  : 'Chưa có';

export const crmLocalTime = (date = new Date()) => date.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T').slice(0, 16);
export const crmIsoTime = value => new Date(`${value}:00+07:00`).toISOString();
export const isOverdue = activity => activity?.status === 'pending' && new Date(activity.scheduled_at).getTime() < Date.now();

export function normalizeCrmPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\.\-\(\)]+/g, '').trim();
  if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.slice(3);
  else if (/^84([35789]\d{8})$/.test(cleaned)) cleaned = '0' + cleaned.slice(2);
  return cleaned.replace(/\D/g, '').slice(0, 11);
}

export async function checkCustomerDuplicates(data) {
  return customerRequest('/check-duplicates', { method: 'POST', data });
}

export async function mergeCustomers(primaryId, secondaryId, reason = '') {
  return customerRequest('/merge', {
    method: 'POST',
    data: { primary_id: Number(primaryId), secondary_id: Number(secondaryId), reason },
  });
}
