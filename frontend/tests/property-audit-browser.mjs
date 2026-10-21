import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../node_modules/.audit-browser/node_modules/playwright');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3101';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG0kAAAAASUVORK5CYII=';
const fixture = (id, extra = {}) => ({ id, code: `AUDIT-${id}`, title: `Biệt thự audit ${id}`, status: 1, purpose: 'sale', price: id * 1e9, price_sale: id * 1e9, price_sale_text: `${id} tỷ`, area: id * 50, type: 'Biệt thự', bedrooms: id, bathrooms: 2, address: '12 Nguyễn Văn Hưởng', street: '12 Nguyễn Văn Hưởng', district: 'Thảo Điền', city: 'TP. Hồ Chí Minh', lat: 10.8 + id / 1000, lng: 106.7, description: `Mô tả thật từ SQL ${id}`, image: pixel, created_at: `2026-10-${10 + id}T00:00:00Z`, ...extra });
const failures = [];
async function check(name, test) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.setDefaultTimeout(20000);
  let rows = [fixture(1), fixture(2), fixture(3), fixture(4), fixture(5, { lat: null, lng: null })];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ status: 401, json: { message: 'Guest' } });
    let data = [];
    if (path === '/api/properties') data = rows;
    if (path === '/api/property-types') data = { data: [{ id: 1, name: 'Biệt thự', status: 1 }] };
    if (route.request().method() !== 'GET') {
      assert.equal(path, '/api/history', 'Browser fixture must never send a real write');
      data = { status: 'success' };
    }
    return route.fulfill({ json: data });
  });
  await page.route(/https:\/\/(?!127\.0\.0\.1|localhost)/, route => route.fulfill({ status: 200, body: '' }));
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.locator('main h3').filter({ hasText: 'Biệt thự audit 1' }).first().waitFor({ timeout: 120000 });
    await test(page, { update: fn => { rows = fn(rows); }, errors });
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('PASS:', name);
  } catch (error) {
    failures.push({ name, error: error.message });
    console.log('FAIL:', name, error.message);
    await page.screenshot({ path: new URL(`audit-${failures.length}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  } finally { await page.close(); }
}
try {
  await check('Search, filters, sorting, share link, recent history and mobile map', async page => {
    const search = page.getByPlaceholder('Nhập tên dự án, đường, mã căn (tối đa 250 ký tự)...');
    await search.fill('nguyen AUDIT-2');
    await page.waitForFunction(() => document.querySelectorAll('main h3').length > 0 && [...document.querySelectorAll('main h3')].filter(n => n.textContent.includes('Biệt thự audit ')).length === 1);
    await search.fill('');
    await page.getByTitle('Thêm vào so sánh', { exact: true }).first().waitFor();
    const sort = page.locator('select').filter({ has: page.locator('option[value="price-desc"]') });
    await sort.selectOption('price-desc');
    assert.equal(await page.locator('main h3').filter({ hasText: 'Biệt thự audit' }).first().innerText(), 'Biệt thự audit 5');
    await page.goto(`${base}/?property=AUDIT-2`, { waitUntil: 'domcontentloaded' });
    await page.getByTitle('Chia sẻ liên kết', { exact: true }).waitFor();
    assert.ok(await page.getByRole('heading', { name: 'Biệt thự audit 2', exact: true }).count());
    assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('3tv_recent_views')))).some(p => p.code === 'AUDIT-2'));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByTitle('Xem trên bản đồ', { exact: true }).click();
    await page.getByText('Hiển thị 4 bất động sản trên bản đồ', { exact: true }).waitFor();
    assert.equal(await page.locator('.leaflet-marker-icon').count(), 4);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: new URL('audit-map-mobile.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  });
  await check('Card share falls back when clipboard is rejected', async page => {
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard denied'); } } }));
    let fallback = false;
    page.once('dialog', async dialog => { fallback = dialog.message().includes('Sao chép liên kết'); await dialog.dismiss(); });
    await page.getByTitle('Chia sẻ link', { exact: true }).first().click();
    await page.waitForTimeout(300);
    assert.ok(fallback, 'Must show a copyable link instead of false success');
  });
  await check('Details show SQL description and accurate map coordinates', async page => {
    assert.equal(await page.getByText('1 ảnh', { exact: true }).count(), 5, 'Card image counts must match real images');
    await page.locator('main h3').filter({ hasText: 'Biệt thự audit 1' }).first().click();
    await page.getByTitle('Chia sẻ liên kết', { exact: true }).waitFor();
    assert.ok(await page.getByText('Mô tả thật từ SQL 1', { exact: true }).count(), 'Database description must be shown');
    const map = await page.locator('iframe[title="Bản đồ vị trí"]').getAttribute('src');
    assert.ok(decodeURIComponent(map).includes('10.801,106.7'), 'Details map must use saved coordinates');
    assert.equal(await page.locator('img[alt="thumbnail"]').count(), 1, 'Do not invent gallery images');
    assert.ok(await page.getByText('Chưa cập nhật số điện thoại', { exact: true }).count());
    assert.equal(await page.locator('a[href="tel:0912888777"]').count(), 0, 'Do not invent an owner phone number');
  });
  await check('Comparison and saved favorites refresh after SQL/API changes and hidden records disappear', async (page, state) => {
    await page.getByTitle('Lưu tin yêu thích', { exact: true }).first().click();
    for (let i = 0; i < 4; i++) {
      await page.getByTitle('Thêm vào so sánh', { exact: true }).nth(i).click();
      await page.locator('#compare-drawer button[aria-expanded="true"]').click();
    }
    let capped = false;
    page.once('dialog', async dialog => { capped = dialog.message().includes('4'); await dialog.dismiss(); });
    await page.getByTitle('Thêm vào so sánh', { exact: true }).nth(4).click();
    assert.ok(capped);
    assert.ok((await page.locator('#compare-drawer').innerText()).includes('4/4'));
    state.update(rows => rows.map(p => p.id === 1 ? { ...p, title: 'Tên mới SQL', price: 6e9, price_sale: 6e9, price_sale_text: '6 tỷ' } : p));
    await page.evaluate(() => window.dispatchEvent(new Event('3tv:properties-changed')));
    await page.locator('main h3').filter({ hasText: 'Tên mới SQL' }).first().waitFor();
    await page.locator('#compare-drawer button[aria-expanded="false"]').click();
    assert.ok((await page.locator('#compare-drawer').innerText()).includes('Tên mới SQL'), 'Comparison must refresh');
    await page.locator('#compare-drawer').getByLabel('Chỉ hiện khác biệt').check();
    assert.equal(await page.locator('#compare-drawer').getByRole('rowheader', { name: 'Phòng tắm', exact: true }).count(), 0);
    for (const width of [390, 820, 1365]) {
      await page.setViewportSize({ width, height: 900 });
      const bounds = await page.locator('#compare-drawer').boundingBox();
      assert.ok(bounds.height < 810 && bounds.width <= width + 1);
    }
    await page.screenshot({ path: new URL('audit-comparison-desktop.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
    await page.locator('#compare-drawer').getByRole('button', { name: 'Xóa tất cả', exact: true }).click();
    await page.getByTitle('Tin đăng đã lưu', { exact: true }).click();
    await page.getByRole('heading', { name: /Danh Sách Tin Đăng Đã Lưu/ }).waitFor();
    assert.ok(await page.getByText('Tên mới SQL', { exact: true }).count(), 'Favorite must refresh');
    state.update(rows => rows.filter(p => p.id !== 1));
    await page.evaluate(() => window.dispatchEvent(new Event('3tv:properties-changed')));
    await page.getByRole('heading', { name: 'Danh Sách Tin Đăng Đã Lưu (0)', exact: true }).waitFor();
  });
} finally { await browser.close(); }
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
