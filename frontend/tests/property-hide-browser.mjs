import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  const property = { id: 22, code: 'TEST-HIDE', title: 'Test biệt thự', price: '25000000000.00', price_sale: '25000000000.00', price_sale_text: '25 tỷ', area: 300, type: 'Biệt thự đơn lập', purpose: 'sale', status: 1, owner_name: 'Tester', city: 'TP. Hồ Chí Minh' };
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/assets/index-C7U9_FcE.js*', route => {
    const code = readFileSync(new URL('../dist/assets/index-C7U9_FcE.js', import.meta.url), 'utf8');
    return route.fulfill({ contentType: 'application/javascript', body: code.replace('children:e.jsx(Gu,{})', 'children:e.jsx(Pu,{})') });
  });
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url());
    let data;
    if (request.method() !== 'GET') {
      const body = request.postDataJSON();
      writes.push({ path: url.pathname, body });
      if (url.pathname.endsWith('/status')) property.status = body.status;
      else if (url.pathname.endsWith('/bulk-action')) property.status = body.action === 'hide' ? 4 : 1;
      else throw new Error('Unexpected write: ' + url.pathname);
      data = { data: property, message: 'Thao tác thành công.' };
    } else if (url.pathname.endsWith('/stats')) {
      data = { total: 1, active: property.status === 1 ? 1 : 0, hidden: property.status === 4 ? 1 : 0, pending: 0, sold: 0, expired: 0, trash: 0, total_value_text: '25 tỷ' };
    } else {
      data = { data: [property], meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 } };
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto('http://localhost:3000/#admin/properties', { waitUntil: 'domcontentloaded' });
  await page.getByTitle('Tạm ẩn bài đăng', { exact: true }).waitFor({ timeout: 60000 });
  await page.getByTitle('Tạm ẩn bài đăng', { exact: true }).click();
  await page.getByTitle('Bật hiển thị', { exact: true }).waitFor();
  assert.equal(property.status, 4);
  assert.equal(writes[0].body.status, 4);
  assert.equal(await page.getByText('Vui lòng nhập lý do tạm ẩn/từ chối.', { exact: true }).count(), 0);
  await page.getByTitle('Bật hiển thị', { exact: true }).click();
  await page.getByTitle('Tạm ẩn bài đăng', { exact: true }).waitFor();
  await page.locator('tbody tr').first().locator('td').first().getByRole('button').click();
  await page.getByRole('button', { name: 'Tạm ẩn', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[title="Bật hiển thị"]'));
  assert.equal(property.status, 4);
  assert.equal(writes.at(-1).body.action, 'hide');
  assert.deepEqual(errors, []);
  console.log('PASS: actual management UI quick hide, show and bulk hide without a reason dialog. API mocked; no real listing changed.');
} finally { await browser.close(); }
