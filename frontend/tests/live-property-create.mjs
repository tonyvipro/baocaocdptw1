import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const context = await browser.newContext();
  const login = await context.request.post('http://localhost:3000/api/login', { data: { email: 'admin@3tvland.vn', password: 'Admin@123456' } });
  console.log('login status', login.status());
  const me = await context.request.get('http://localhost:3000/api/me');
  console.log('me status', me.status());
  console.log('cookie names', (await context.cookies()).map(c => c.name));
  assert.equal(login.status(), 200);
  assert.equal(me.status(), 200);
  if (process.argv.includes('--create')) {
    const user = (await me.json()).user;
    const types = (await (await context.request.get('http://localhost:3000/api/property-types')).json()).data;
    const type = types.find(t => t.name === 'Biệt thự đơn lập' && Number(t.status) === 1) || types.find(t => Number(t.status) === 1);
    assert.ok(type);
    const title = `SYNC-VERIFY-${Date.now()}`;
    let createdId;
    try {
      const page = await context.newPage();
      await page.addInitScript(user => { localStorage.setItem('3tv_user', JSON.stringify(user)); localStorage.setItem('3tv_app_mode', 'admin'); localStorage.setItem('3tv_admin_active_menu', 'properties'); }, user);
      await page.goto('http://localhost:3000/#admin/properties', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /Thêm BĐS mới/ }).click({ timeout: 60000 });
      await page.locator('input[name="title"]').fill(title);
      await page.getByRole('textbox', { name: 'Mức giá', exact: true }).fill('2500000000');
      await page.getByRole('textbox', { name: 'Diện tích', exact: true }).fill('125.50');
      await page.locator('select[name="type"] option').filter({ hasText: type.name }).first().waitFor({ state: 'attached' });
      await page.locator('select[name="type"]').selectOption({ label: type.name });
      await page.locator('input[name="address"]').fill('Địa chỉ kiểm tra đồng bộ tự động');
      const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === '/api/properties' && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Đăng tin mới', exact: true }).click();
      const response = await responsePromise;
      const data = await response.json();
      assert.equal(response.status(), 201, JSON.stringify(data));
      assert.equal(data.data.title, title);
      createdId = data.data.id;
      const sql = JSON.parse(execFileSync(process.env.SQL_VERIFY_PHP || 'C:/wamp64/bin/php/php8.4.25/php.exe', ['scripts/verify-created-property.php', String(createdId)], { cwd: fileURLToPath(new URL('../../backend/', import.meta.url)), env: process.env, encoding: 'utf8' }));
      assert.equal(sql.database, 'baocaocdptw1_db');
      assert.equal(sql.title, title);
      assert.equal(sql.property_type_id, type.id);
      const updatedTypes = (await (await context.request.get('http://localhost:3000/api/property-types')).json()).data;
      assert.equal(updatedTypes.find(t => t.id === type.id).properties_count, type.properties_count + 1);
      console.log('LIVE PASS: authenticated administration form creates a real SQL row in baocaocdptw1_db and increments its SQL category count.');
    } finally {
      if (createdId) {
        assert.equal((await context.request.delete(`http://localhost:3000/api/properties/${createdId}`)).status(), 200);
        assert.equal((await context.request.delete(`http://localhost:3000/api/properties/${createdId}/force`)).status(), 200);
        console.log('Temporary verification property removed; existing listings unchanged.');
      }
    }
  }
} finally { await browser.close(); }
