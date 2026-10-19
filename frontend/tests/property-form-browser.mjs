import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  const fixture = { id: 22, title: 'Test BĐS Biệt Thự Thảo Điền Quận 2', price: '25000000000.00', area: 300, address: '12 Nguyễn Văn Hưởng', type: 'Biệt thự đơn lập', purpose: 'sale', status: 1 };
  const errors = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/assets/index-C7U9_FcE.js*', route => {
    let script = readFileSync(new URL('../dist/assets/index-C7U9_FcE.js', import.meta.url), 'utf8');
    assert.ok(script.includes('children:e.jsx(Gu,{})'));
    script = script.replace('children:e.jsx(Gu,{})', `children:e.jsx(Bu,{property:${JSON.stringify(fixture)},onClose:()=>{},onSuccess:()=>{}})`);
    return route.fulfill({ contentType: 'application/javascript', body: script });
  });
  await page.route('**/api/properties/22', async route => {
    writes.push(route.request().url());
    await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Địa chỉ chi tiết không được vượt quá 255 ký tự.', errors: { address: ['Địa chỉ quá dài.'] } }) });
  });
  await page.goto('http://localhost:3000/#admin/properties', { waitUntil: 'domcontentloaded' });
  const price = page.getByRole('textbox', { name: 'Mức giá', exact: true });
  const area = page.getByRole('textbox', { name: 'Diện tích', exact: true });
  await price.waitFor({ timeout: 60000 });
  for (const input of [price, area]) {
    const previous = await input.inputValue();
    assert.equal(await input.getAttribute('type'), 'tel');
    const unsolicitedDeletion = await input.evaluate(node => !node.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' })));
    assert.equal(unsolicitedDeletion, true, 'IME deletion before a letter keydown must be blocked');
    await input.press('End');
    await input.pressSequentially('dDeE+-abc');
    assert.equal(await input.inputValue(), previous);
    await input.press('ControlOrMeta+A');
    await input.press('d');
    assert.equal(await input.inputValue(), previous, 'd must not delete selected digits');
    await input.press('e');
    assert.equal(await input.inputValue(), previous, 'e must not delete selected digits');
    const blocked = await input.evaluate(node => !node.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' })));
    assert.equal(blocked, true, 'IME deletion after d must be cancelled');
    assert.equal(await input.inputValue(), previous);
    await input.evaluate(node => {
      node.value = node.value.slice(0, -1);
      node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    });
    assert.equal(await input.inputValue(), previous, 'uncancellable IME deletion must be rolled back');
    await input.press('End');
    await input.press('Backspace');
    assert.equal(await input.inputValue(), previous.slice(0, -1), 'physical Backspace must still work');
    await input.fill(previous);
    await input.evaluate(node => {
      const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
      paste.clipboardData.setData('text/plain', 'd');
      node.dispatchEvent(paste);
    });
    assert.equal(await input.inputValue(), previous);
    await input.fill('1e6');
    assert.ok(!(await input.inputValue()).includes('e'));
  }
  for (const input of [price, area]) {
    await input.fill('1'.repeat(20));
    assert.equal(await input.inputValue(), '1'.repeat(20));
    await input.press('End');
    await input.press('1');
    assert.equal(await input.inputValue(), '1'.repeat(20));
    await page.getByText('Mức giá bạn muốn bán đã nhiều hơn tài sản của tỉ phú Elon Musk', { exact: true }).waitFor();
  }
  await price.fill('25000000000');
  await area.fill('100000001');
  await page.getByRole('button', { name: 'Cập nhật thông tin' }).click();
  await page.getByText('Diện tích phải lớn hơn 0 và không vượt quá 100.000.000.', { exact: true }).waitFor();
  assert.equal(writes.length, 0);
  await area.fill('300.25');
  await price.fill('9999999999999.99');
  await page.getByRole('button', { name: 'Cập nhật thông tin' }).click();
  await page.getByText('Mức giá phải từ 0 và không vượt quá 9.999.999.999.999.', { exact: true }).waitFor();
  assert.equal(writes.length, 0);
  const address = page.getByRole('textbox', { name: 'Địa chỉ chi tiết', exact: true });
  assert.equal(await address.getAttribute('maxlength'), '255');
  await address.fill('Đ'.repeat(300));
  assert.ok((await address.inputValue()).length <= 255);
  await price.fill('25000000000');
  await page.getByRole('button', { name: 'Cập nhật thông tin' }).click();
  await page.getByText('Địa chỉ chi tiết không được vượt quá 255 ký tự.', { exact: true }).waitFor();
  assert.deepEqual(writes, ['http://localhost:3000/api/properties/22']);
  assert.equal(await page.getByText('Vui lòng đăng nhập lại.', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: deployed edit form blocks exponent keys/paste, validates oversized numbers, limits address, preserves API 422 and never retries on port 8080. No real data was changed.');
} finally { await browser.close(); }
