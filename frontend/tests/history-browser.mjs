import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { availableRecentViews } from '../src/utils/propertyCatalog.js';
const active = { id: 1, code: 'VISIBLE', title: 'Tin còn hiển thị', status: 1, purpose: 'sale', area: 80, price_sale_text: '3 tỷ' };
const hidden = { id: 2, code: 'HIDDEN', title: 'Tin đã tạm ẩn', status: 4, purpose: 'sale' };
const history = [{ ...active, viewed_at: new Date().toISOString() }, { ...hidden, status: 1 }];
assert.deepEqual(availableRecentViews(history, [active, hidden]).map(p => p.code), ['VISIBLE']);
assert.deepEqual(availableRecentViews(history, []), []);
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  let catalog = [active];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(data => localStorage.setItem('3tv_recent_views', JSON.stringify(data)), history);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    await route.fulfill({ status: url.pathname.endsWith('/me') ? 401 : 200, contentType: 'application/json', body: JSON.stringify(url.pathname === '/api/properties' ? catalog : []) });
  });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.getByText('Tin còn hiển thị', { exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByText('Đã xem', { exact: true }).first().click();
  await page.getByText('Lịch Sử Xem Tin', { exact: true }).waitFor();
  assert.equal(await page.getByText('Tin đã tạm ẩn', { exact: true }).count(), 0);
  catalog = [];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByText('Chưa có lịch sử xem tin', { exact: true }).waitFor();
  assert.equal(await page.getByText('Tin còn hiển thị', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: hidden listings excluded from local history, modal, recent section and count after catalog refresh. API mocked; no real data changed.');
} finally { await browser.close(); }
