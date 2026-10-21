import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../node_modules/.audit-browser/node_modules/playwright');
const base = process.env.LIVE_SITE_URL || 'http://127.0.0.1:3000';
const catalog = await (await fetch(base + '/api/properties', { signal: AbortSignal.timeout(45000) })).json();
assert.ok(Array.isArray(catalog) && catalog.length > 0);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // No stored account, no mocked API, no requests that change database records.
  await page.route('**/api/**', route => {
    assert.equal(route.request().method(), 'GET', 'Live smoke test only permits reads');
    return route.continue();
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const search = page.getByPlaceholder('Nhập tên dự án, đường, mã căn (tối đa 250 ký tự)...');
  await search.fill(catalog[0].code);
  await page.locator('main h3').filter({ hasText: catalog[0].title }).first().waitFor({ timeout: 60000 });
  await search.fill('');
  await page.getByTitle('Xem trên bản đồ', { exact: true }).click();
  const count = catalog.filter(p => p.lat !== null && p.lng !== null && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180).length;
  await page.waitForFunction(count => document.querySelectorAll('.leaflet-marker-icon').length === count, count, { timeout: 30000 });
  let tilesLoaded = false;
  try {
    await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].some(img => img.complete && img.naturalWidth > 0), null, { timeout: 20000 });
    tilesLoaded = true;
  } catch { /* Report external tile availability separately from marker correctness. */ }
  assert.deepEqual(errors, []);
  await page.screenshot({ path: new URL('audit-live-map.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  console.log(`PASS: live site, ${catalog.length} SQL listings, exact code search, ${count} map markers, no uncaught JS errors; external map tiles loaded: ${tilesLoaded}.`);
} finally { await browser.close(); }
