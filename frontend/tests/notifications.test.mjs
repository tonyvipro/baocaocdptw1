import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { downloadActivityLogs, notificationDate, notificationDestination, notificationRequest } from '../src/services/notifications.js';

const original = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, window: globalThis.window };
try {
  globalThis.localStorage = { getItem: () => 'test-token' };
  globalThis.window = new EventTarget();
  let authRequired = 0;
  window.addEventListener('3tv:auth-required', () => authRequired++);
  globalThis.fetch = async (url, config) => {
    assert.equal(url, '/api/notifications/read-all');
    assert.equal(config.method, 'PATCH');
    assert.equal(config.credentials, 'same-origin');
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    return Response.json({ unread_count: 0, updated: 12 });
  };
  assert.equal((await notificationRequest('/read-all', { method: 'PATCH' })).updated, 12);
  globalThis.fetch = async () => Response.json({ message: 'Vui lòng đăng nhập.' }, { status: 401 });
  await assert.rejects(notificationRequest('/unread-count', { silentAuth: true }), error => error.status === 401);
  assert.equal(authRequired, 0, 'Background badge must not interrupt visitors with a login popup');
  await assert.rejects(notificationRequest(), /Vui lòng đăng nhập/);
  assert.equal(authRequired, 1);
  globalThis.fetch = async () => new Response('<html>Server error</html>', { status: 500 });
  await assert.rejects(notificationRequest(), /chưa trả dữ liệu thông báo hợp lệ/);
  await assert.rejects(downloadActivityLogs(), /Không thể tải xuống nhật ký/);
  globalThis.fetch = async url => {
    assert.equal(url, '/api/notifications/logs/download');
    return new Response('\uFEFFNgày,Người dùng,Hoạt động,Chi tiết\n', {
      headers: { 'content-type': 'text/csv; charset=UTF-8', 'content-disposition': 'attachment; filename="nhat-ky-hoat-dong-2026-10-20.csv"' },
    });
  };
  const file = await downloadActivityLogs();
  assert.equal(file.filename, 'nhat-ky-hoat-dong-2026-10-20.csv');
  assert.match(await file.blob.text(), /Người dùng/);
  globalThis.localStorage = { getItem() { throw new Error('Storage unavailable'); } };
  globalThis.fetch = async (_url, config) => { assert.equal(config.headers.Authorization, undefined); return Response.json({}); };
  await notificationRequest();
  assert.match(notificationDate('2026-10-20T08:30:00Z'), /15:30/);
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { default: Navbar } = await server.ssrLoadModule('/src/components/Navbar.jsx');
  const navbar = renderToStaticMarkup(React.createElement(Navbar, { currentUser: { id: 1, role_id: 1, name: 'Admin' } }));
  assert.match(navbar, /title="Thông báo &amp; Nhật ký"/);
  for (const text of ['Tất Cả Nhà Đất', 'Nhà Đất Bán', 'Nhà Đất Cho Thuê']) assert.ok(!navbar.includes(text), text + ' removed from navigation');
  const { default: Page } = await server.ssrLoadModule('/src/pages/NotificationsPage.jsx');
  const page = renderToStaticMarkup(React.createElement(Page, { currentUser: { id: 1, role_id: 1 } }));
  const columns = [...page.matchAll(/<thead[\s\S]*?<\/thead>/g)].map(match => [...match[0].matchAll(/<th\s[^>]*>(.*?)<\/th>/g)].map(cell => cell[1]));
  assert.deepEqual(columns, [['Ngày', 'Loại thông báo', 'Nội dung', 'Trạng thái', 'Thao tác'], ['Ngày', 'Người dùng', 'Hoạt động', 'Chi tiết', 'Thao tác']]);
  const { ActivityAction } = await server.ssrLoadModule('/src/pages/NotificationsPage.jsx');
  const action = renderToStaticMarkup(React.createElement(ActivityAction, { destination: { url: '#admin/demands?record=7', label: 'Xem nhu cầu' } }));
  assert.match(action, /href="#admin\/demands\?record=7"/);
  assert.equal(notificationDestination({ url: 'https://evil.example' }), null);
  assert.equal(notificationDestination({ url: 'javascript:alert(1)' }), null);
  assert.match(page, /Đánh dấu tất cả là đã đọc/);
  assert.match(page, /Tải xuống Nhật ký/);
  assert.match(page, /aria-busy="true"/);
  const guest = renderToStaticMarkup(React.createElement(Page, { currentUser: null, onLogin() {} }));
  assert.match(guest, /Vui lòng đăng nhập/);
  assert.ok(!guest.includes('<table'), 'Guests do not render private records');
} finally { await server.close(); }
console.log('PASS: notification navigation, table columns, guest state, authenticated requests, silent badge errors, CSV download and Vietnam timezone.');
