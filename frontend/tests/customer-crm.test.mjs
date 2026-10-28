import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { customerRequest, crmLocalTime, crmIsoTime, isOverdue } from '../src/services/customers.js';

assert.equal(crmIsoTime('2026-10-19T15:30'), '2026-10-19T08:30:00.000Z');
assert.equal(crmLocalTime(new Date('2026-10-19T08:30:00Z')), '2026-10-19T15:30');
assert.equal(isOverdue({ status: 'completed', scheduled_at: '2000-01-01T00:00:00Z' }), false);
assert.equal(isOverdue({ status: 'pending', scheduled_at: '2000-01-01T00:00:00Z' }), true);

const original = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, window: globalThis.window };
try {
  globalThis.localStorage = { getItem: () => 'valid-test-token' };
  globalThis.window = new EventTarget();
  let authRequired = 0;
  window.addEventListener('3tv:auth-required', () => authRequired++);
  globalThis.fetch = async (url, config) => {
    assert.equal(url, '/api/customers/12');
    assert.equal(config.credentials, 'same-origin');
    assert.equal(config.headers.Authorization, 'Bearer valid-test-token');
    assert.equal(config.method, 'PUT');
    assert.deepEqual(JSON.parse(config.body), { version: 3, name: 'Khách hàng' });
    return new Response(JSON.stringify({ data: { id: 12 } }), { status: 200 });
  };
  assert.equal((await customerRequest('/12', { method: 'PUT', data: { version: 3, name: 'Khách hàng' } })).data.id, 12);
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Dữ liệu đã thay đổi.' }), { status: 409 });
  await assert.rejects(customerRequest('/12'), error => error.status === 409 && error.message === 'Dữ liệu đã thay đổi.');
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'SĐT không hợp lệ.', errors: { phone: ['Chỉ nhập 10–11 số.'] } }), { status: 422 });
  await assert.rejects(customerRequest('/12'), error => error.fields.phone[0] === 'Chỉ nhập 10–11 số.');
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Phiên đã hết hạn.' }), { status: 401 });
  await assert.rejects(customerRequest(), /Phiên đã hết hạn/);
  assert.equal(authRequired, 1);
  globalThis.fetch = async () => new Response('<html>Fatal error</html>', { status: 500 });
  await assert.rejects(customerRequest(), /chưa trả dữ liệu hợp lệ/);
  globalThis.localStorage = { getItem: () => { throw new Error('Storage unavailable'); } };
  globalThis.fetch = async (_url, config) => { assert.equal(config.headers.Authorization, undefined); return new Response('{}'); };
  await customerRequest();
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}

// Render real React components using fixtures, without touching a live account.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Form } = await server.ssrLoadModule('/src/components/customers/CustomerForm.jsx');
  const options = { can_assign: true, groups: { new: 'Khách hàng mới' }, statuses: { new: 'Chưa liên hệ' }, assignees: [{ id: 1, name: 'Admin' }] };
  const customer = { id: 12, version: 1, name: 'Khách hàng', assigned_to: { id: 1 } };
  const html = renderToStaticMarkup(React.createElement(Form, { options, customer, onClose() {}, onSaved() {} }));
  assert.match(html, /role="dialog"/);
  assert.match(html, /name="phone"[^>]+maxLength="11"/);
  assert.match(html, /pattern="\[0-9\]\{10,11\}"/);
  assert.match(html, /name="name"[^>]+maxLength="250"/);
  assert.match(html, /Theo dõi khách hàng/);
  assert.ok(!html.includes('name="source"'), 'Management edits only customer identity fields');
  const trackingForm = renderToStaticMarkup(React.createElement(Form, { options, customer, mode: 'tracking', onClose() {}, onSaved() {} }));
  assert.match(trackingForm, /Người phụ trách/);
  assert.ok(!trackingForm.includes('name="email"'), 'Tracking edits status, source and assignee');
  const { default: Management } = await server.ssrLoadModule('/src/pages/admin/CustomerManagement.jsx');
  for (const [view, expected] of [
    ['management', ['Tên khách hàng', 'Công ty', 'Email', 'Số điện thoại', 'Nhóm khách hàng', 'Ngày tạo', 'Hành động']],
    ['tracking', ['ID', 'Tên khách hàng', 'Công ty/Nguồn', 'Trạng thái', 'Lần tương tác cuối', 'Hoạt động tiếp theo', 'Người phụ trách', 'Hành động']],
  ]) {
    const page = renderToStaticMarkup(React.createElement(Management, { currentUser: { id: 1, role_id: 1 }, initialView: view }));
    const heading = page.match(/<thead[\s\S]*?<\/thead>/)[0];
    const columns = [...heading.matchAll(/<th\s[^>]*>(.*?)<\/th>/g)].map(match => match[1]);
    assert.deepEqual(columns, expected, view + ' matches the requested table');
    assert.match(page, /aria-busy="true"/);
    assert.ok(!page.includes('Tổng khách hàng') && !page.includes('Mọi trạng thái') && !page.includes('Thêm khách hàng'), 'Extra dashboard widgets and create action removed');
  }
} finally { await server.close(); }
console.log('PASS: CRM errors, timezone, input limits, separate management/tracking tables and simplified forms.');
