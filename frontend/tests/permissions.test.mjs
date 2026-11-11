import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { hasPermission, canOpenAdminMenu, firstAdminMenu } from '../src/utils/permissions.js';

const broker = { id: 2, role_id: 2, is_active: true, role_label: 'Broker (Môi giới)',
  permissions: ['admin.access', 'customers.manage', 'demands.manage', 'notifications.view'] };
assert.equal(canOpenAdminMenu(broker, 'customers'), true);
assert.equal(canOpenAdminMenu(broker, 'dashboard'), false);
assert.equal(canOpenAdminMenu(broker, 'roles'), false);
assert.equal(firstAdminMenu(broker), 'customers');
assert.equal(hasPermission({ role_id: 1, role: 'Admin' }, 'users.manage'), false, 'role IDs/names cannot substitute for capabilities');
assert.equal(canOpenAdminMenu({ ...broker, role_id: 999 }, 'customers'), true, 'server capabilities determine the menu');
assert.equal(canOpenAdminMenu({ ...broker, is_active: false }, 'customers'), false);
assert.equal(canOpenAdminMenu(broker, 'unknown-menu'), false);

const saved = { window: globalThis.window, localStorage: globalThis.localStorage };
globalThis.localStorage = { getItem: () => null };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Layout } = await server.ssrLoadModule('/src/pages/admin/AdminLayout.jsx');
  const { default: ConfirmProvider } = await server.ssrLoadModule('/src/components/forms/ConfirmProvider.jsx');
  globalThis.window = Object.assign(new EventTarget(), { location: { hash: '#admin/roles' } });
  const render = user => renderToStaticMarkup(React.createElement(ConfirmProvider, null,
    React.createElement(Layout, { currentUser: user })));
  const html = render(broker);
  assert.match(html, /Bạn không có quyền truy cập chức năng này/);
  assert.match(html, /Quản lý khách hàng/);
  assert.ok(!html.includes('Gán vai trò (Phân quyền)'), 'denied menu and role assignment screen must not render for a direct hash');
  assert.ok(!html.includes('Danh Sách Tài Khoản Người Dùng'), 'protected screen is not mounted behind the denial');
  window.location.hash = '#admin/categories';
  const without = render(broker);
  assert.match(without, /Bạn không có quyền truy cập chức năng này/);
  const withGrant = render({
    ...broker, permissions: [...broker.permissions, 'categories.manage'],
  });
  assert.ok(!withGrant.includes('Bạn không có quyền truy cập chức năng này'), 'a capability returned by the server immediately changes both navigation and hash access');
  assert.match(withGrant, /Quản lý Danh mục/);
} finally {
  await server.close();
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}
console.log('PASS: server capabilities control menu visibility, unknown/inactive users and direct hash access.');
