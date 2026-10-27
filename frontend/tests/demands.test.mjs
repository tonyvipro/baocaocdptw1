import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { demandBudget, demandDigits, demandRequest } from '../src/services/demands.js';

assert.equal(demandDigits('5e+1.2 a₫-'), '512');
assert.equal(demandDigits('123456789012345678'), '123456789012345');
assert.equal(demandBudget('5000000000', '5000000000'), '5.000.000.000 VNĐ');
assert.equal(demandBudget('0', '10000000'), '0 – 10.000.000 VNĐ');
assert.equal(demandBudget('00', '0'), '0 VNĐ');
const original = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, window: globalThis.window };
try {
  globalThis.localStorage = { getItem: () => 'test-token' };
  globalThis.window = new EventTarget();
  let authRequired = 0;
  window.addEventListener('3tv:auth-required', () => authRequired++);
  globalThis.fetch = async (url, config) => {
    assert.equal(url, '/api/demands/12'); assert.equal(config.method, 'PUT');
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    assert.equal(config.credentials, 'same-origin');
    assert.deepEqual(JSON.parse(config.body), { version: 2, budget_min: '1000000000' });
    return Response.json({ data: { id: 12 } });
  };
  assert.equal((await demandRequest('/12', { method: 'PUT', data: { version: 2, budget_min: '1000000000' } })).data.id, 12);
  globalThis.fetch = async () => Response.json({ message: 'Nhu cầu vừa được cập nhật.' }, { status: 409 });
  await assert.rejects(demandRequest('/12'), error => error.status === 409);
  globalThis.fetch = async () => Response.json({ message: 'Ngân sách không hợp lệ.', errors: { budget_max: ['Khoảng ngân sách không hợp lệ.'] } }, { status: 422 });
  await assert.rejects(demandRequest(), error => error.fields.budget_max[0] === 'Khoảng ngân sách không hợp lệ.');
  globalThis.fetch = async () => Response.json({ message: 'Vui lòng đăng nhập.' }, { status: 401 });
  await assert.rejects(demandRequest(), /Vui lòng đăng nhập/); assert.equal(authRequired, 1);
  globalThis.fetch = async () => new Response('<html>Server error</html>', { status: 500 });
  await assert.rejects(demandRequest(), error => error.status === 500 && error.message.includes('kiểm tra backend'));
  globalThis.fetch = async () => new Response('', { status: 500 });
  await assert.rejects(demandRequest(), /HTTP 500/);
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(demandRequest(), /Không kết nối được máy chủ nhu cầu/);
  globalThis.fetch = async (_url, config) => new Promise((_, reject) => config.signal.addEventListener('abort', () => reject(config.signal.reason), { once: true }));
  await assert.rejects(demandRequest('', { timeoutMs: 10 }), /phản hồi quá lâu/);
  const cancelled = new AbortController();
  const request = demandRequest('', { signal: cancelled.signal });
  cancelled.abort();
  await assert.rejects(request, error => error.name === 'AbortError');
  globalThis.fetch = async () => new Response('<html>Login</html>', { status: 401 });
  await assert.rejects(demandRequest(), error => error.status === 401 && error.message.includes('đăng nhập'));
  assert.equal(authRequired, 2, 'Even non-JSON unauthorized responses require login');
  globalThis.fetch = async () => Response.json(null);
  await assert.rejects(demandRequest(), /chưa trả dữ liệu nhu cầu hợp lệ/);
  globalThis.localStorage = { getItem() { throw new Error('Storage unavailable'); } };
  globalThis.fetch = async (_url, config) => { assert.equal(config.headers.Authorization, undefined); return Response.json({}); };
  await demandRequest();
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { default: Page } = await server.ssrLoadModule('/src/pages/admin/DemandManagement.jsx');
  const html = renderToStaticMarkup(React.createElement(Page, { currentUser: { id: 1, role_id: 1 } }));
  const headings = [...html.match(/<thead[\s\S]*?<\/thead>/)[0].matchAll(/<th\s[^>]*>(.*?)<\/th>/g)].map(match => match[1]);
  assert.deepEqual(headings, ['ID Nhu cầu', 'Tên khách hàng', 'Loại BĐS', 'Ngân sách', 'Khu vực', 'Trạng thái', 'Ngày tạo', 'Hành động']);
  assert.match(html, /Quản lý nhu cầu/i); assert.match(html, /THÊM NHU CẦU MỚI/);
  assert.match(html, /Bộ lọc/); assert.match(html, /aria-busy="true"/);
  assert.match(html, /type="search" maxLength="250"/);
  const denied = renderToStaticMarkup(React.createElement(Page, { currentUser: { id: 5, role_id: 5 } }));
  assert.match(denied, /Admin hoặc Môi giới/); assert.ok(!denied.includes('<table'));
  const { default: Form } = await server.ssrLoadModule('/src/components/demands/DemandForm.jsx');
  const { DemandDetails } = await server.ssrLoadModule('/src/components/demands/DemandDialog.jsx');
  const options = { statuses: { processing: 'Đang xử lý' }, property_types: [{ id: 1, name: 'Căn hộ', status: 1 }, { id: 2, name: 'Loại đã ngừng', status: 0 }] };
  const form = renderToStaticMarkup(React.createElement(Form, { options, onBusy() {}, onClose() {}, onSaved() {} }));
  assert.match(form, /name="budget_min"[^>]*maxLength="15"[^>]*inputMode="numeric"/);
  assert.match(form, /name="budget_max"[^>]*pattern="\[0-9\]\{1,15\}"/);
  assert.match(form, /name="area"[^>]*maxLength="250"/);
  assert.match(form, /name="notes"[^>]*maxLength="250"/);
  assert.ok(!form.includes('Loại đã ngừng'), 'New demands only select active property types');
  const demand = { id: 1, code: 'ND-1001', version: 1, customer_id: 99, property_type_id: 1, budget_min: '4000000000', budget_max: '5000000000', area: 'Quận 1',
    customer: { id: 99, name: 'Khách hàng đang sửa', code: 'KH00099' }, property_type: { id: 1, name: 'Căn hộ' }, status: 'processing', notes: '<script>bad()</script>' };
  const editing = renderToStaticMarkup(React.createElement(Form, { demand, options, onBusy() {}, onClose() {}, onSaved() {} }));
  assert.match(editing, /Khách hàng đang sửa/); assert.match(editing, /Lưu thay đổi/);
  const detail = renderToStaticMarkup(React.createElement(DemandDetails, { demand, options }));
  assert.match(detail, /ND-1001/); assert.match(detail, /4.000.000.000 – 5.000.000.000 VNĐ/);
  assert.ok(detail.includes('&lt;script&gt;') && !detail.includes('<script>'), 'Customer notes render as text');
} finally { await server.close(); }
console.log('PASS: demand table, role guard, forms, budget precision, input limits, error handling and authenticated requests.');
