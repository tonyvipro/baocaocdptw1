import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Reproduce a healthy backend taking longer than the old 3-second timeout.
  await page.route('**/api/properties?*', async route => {
    await new Promise(resolve => setTimeout(resolve, 3500));
    await route.continue();
  });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('22 bất động sản'), null, { timeout: 60000 }).catch(async error => {
    console.log('PAGE ERRORS', errors);
    console.log('PAGE CONTENT', (await page.locator('body').innerText()).slice(0, 2000));
    throw error;
  });
  console.log('INPUTS', await page.locator('input').evaluateAll(nodes => nodes.map(n => ({ placeholder: n.placeholder, type: n.type }))));
  const search = page.locator('input').filter({ visible: true }).first();
  await search.fill('test');
  await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Test BĐS Biệt Thự Thảo Điền Quận 2'));
  await search.fill('  thao dien  ');
  await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Test BĐS Biệt Thự Thảo Điền Quận 2'));
  await search.fill('12 nguyen van huong');
  await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Test BĐS Biệt Thự Thảo Điền Quận 2'));
  await page.screenshot({ path: 'frontend/tests/catalog-search.png', fullPage: true });
  await page.unroute('**/api/properties?*');
  await page.goto('http://localhost:3000/?property=SAL-OPUZ-854', { waitUntil: 'domcontentloaded' });
  await page.getByTitle('Chia sẻ liên kết', { exact: true }).waitFor({ timeout: 60000 });
  console.log('BROWSER PASS: shared link opens property details.');
  // Clipboard rejection must fall back to a link, not report a false success.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
  let shared = false;
  page.once('dialog', async dialog => { shared = dialog.message().includes('Sao chép liên kết'); await dialog.dismiss(); });
  await page.getByTitle('Chia sẻ liên kết', { exact: true }).click();
  await page.waitForTimeout(300);
  assert.ok(shared);
  await page.evaluate(() => {
    localStorage.setItem('3tv_favorites', 'null');
    localStorage.setItem('3tv_recent_views', '{}');
  });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('22 bất động sản'), null, { timeout: 60000 });
  for (let i = 0; i < 4; i++) await page.getByTitle('Thêm vào so sánh', { exact: true }).nth(i).click();
  await page.locator('#compare-drawer').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.locator('#compare-drawer').evaluate(node => node.clientHeight <= window.innerHeight * 0.71));
  await page.locator('#compare-drawer').getByRole('button', { name: 'Xóa tất cả', exact: true }).click();
  await page.locator('#compare-drawer').waitFor({ state: 'detached' });
  await page.getByTitle('Lưu tin yêu thích', { exact: true }).first().click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('3tv_favorites')).length), 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('22 bất động sản'), null, { timeout: 60000 });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('3tv_favorites')).length), 1);
  assert.deepEqual(errors, []);
  console.log('BROWSER PASS: title/unaccented/address search, API delay >3s, shared link, denied clipboard, corrupt localStorage, comparison on mobile and saved favorites after reload; no uncaught JS errors.');
} finally { await browser.close(); }
