import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const admin of [false, true]) {
    const page = await browser.newPage();
    let property = { id: 42, code: 'SYNC-TEST', title: 'Trước chỉnh database', status: 1, purpose: 'sale', type: 'Biệt thự', price: '25000000000', price_sale: '25000000000', price_sale_text: '25 tỷ', area: 80, bedrooms: 2 };
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (admin) await page.route('**/assets/index-C7U9_FcE.js*', route => {
      const code = readFileSync(new URL('../dist/assets/index-C7U9_FcE.js', import.meta.url), 'utf8');
      return route.fulfill({ contentType: 'application/javascript', body: code.replace('children:e.jsx(Gu,{})', 'children:e.jsx(Pu,{})') });
    });
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      let data = [];
      if (path === '/api/properties') data = admin ? { data: [property], meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 } } : [property];
      if (path.endsWith('/stats')) data = { total: 1, active: 1, pending: 0, hidden: 0, trash: 0, sold: 0, total_value_text: '25 tỷ' };
      return route.fulfill({ status: path.endsWith('/me') ? 401 : 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByText('Trước chỉnh database', { exact: true }).first().waitFor({ timeout: 60000 });
    property = { ...property, title: 'Sau chỉnh database', price_sale_text: '26 tỷ', price: '26000000000', price_sale: '26000000000' };
    // No navigation, focus event or manual refresh: periodic fetch must update it.
    await page.getByText('Sau chỉnh database', { exact: true }).first().waitFor({ timeout: 20000 });
    assert.equal(await page.getByText('Trước chỉnh database', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: public catalog and administration display database API changes automatically without page reload. API mocked; no real data changed.');
} finally { await browser.close(); }
