import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  let loginRequests = 0;
  await page.addInitScript(() => { localStorage.setItem('3tv_user', JSON.stringify({ id: 1, name: 'Cached Admin', role_id: 1 })); localStorage.setItem('3tv_app_mode', 'admin'); });
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/login')) loginRequests++;
    const auth = path.endsWith('/me') || path.endsWith('/login');
    const data = auth ? { message: 'Phiên đăng nhập đã hết hạn.' } : path.endsWith('/stats') ? { total: 0 } : new URL(route.request().url()).searchParams.has('admin') ? { data: [], meta: { total: 0, current_page: 1, last_page: 1 } } : [];
    return route.fulfill({ status: auth ? 401 : 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto('http://localhost:3000/#admin/properties', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('name@example.com').waitFor({ timeout: 60000 });
  assert.equal(loginRequests, 0, 'Do not silently sign in with a hardcoded admin password');
  await page.getByPlaceholder('name@example.com').fill('admin@3tvland.vn');
  await page.locator('input[type=password]').fill('admin');
  await page.getByRole('button', { name: 'ĐĂNG NHẬP NGAY', exact: true }).click();
  await page.getByText('Phiên đăng nhập đã hết hạn.', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('3tv_user')), null);
  console.log('PASS: expired SQL session opens real login, preserves management screen and does not report fake admin success.');
} finally { await browser.close(); }
