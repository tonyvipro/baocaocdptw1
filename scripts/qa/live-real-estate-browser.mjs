import assert from 'node:assert/strict';
import path from 'node:path';

export async function runBrowserChecks(env) {
  const { browser, base, output, run, results, write, check, http, admin, poster, guest, property, second, land, setStatus } = env;
  await check('TYPE-05', 'Đổi tên danh mục cập nhật tin liên kết', 'Happy', 'Tên mới xuất hiện ở tin nhưng giữ ID phân loại', async () => {
    const types = await http(admin, 'GET', '/api/property-types');
    const type = types.body.data.find(t => t.id === property.property_type_id);
    assert.ok(type && type.name.startsWith(run));
    const name = type.name + '-Đổi tên';
    const edit = await http(admin, 'PUT', `/api/property-types/${type.id}`, { name, slug: type.slug, status: 1 }); assert.equal(edit.status, 200);
    const list = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(property.code));
    const saved = list.body.find(p => p.id === property.id); assert.equal(saved.type, name); assert.equal(saved.property_type_id, type.id); return { categoryId: type.id, linkedType: saved.type };
  });
  await check('HISTORY-01', 'Lịch sử DB chống trùng và xóa đúng một mục QA', 'Happy', 'Hai lượt xem cùng tin tạo một mục; xóa theo code chỉ xóa mục QA', async () => {
    const before = await http(poster, 'GET', '/api/history');
    for (let i = 0; i < 2; i++) { const r = await http(poster, 'POST', '/api/history', { property: { code: property.code, title: 'QA forged client title' } }); assert.equal(r.status, 200); }
    const got = await http(poster, 'GET', '/api/history'); const match = got.body.filter(p => p.property_data?.code === property.code); assert.equal(match.length, 1); assert.equal(match[0].property_data.title, property.title);
    const otherUser = await http(admin, 'GET', '/api/history'); assert.ok(!otherUser.body.some(p => p.property_data?.code === property.code), 'History leaked across accounts');
    const del = await http(poster, 'DELETE', '/api/history', { code: property.code }); assert.equal(del.status, 200);
    const after = await http(poster, 'GET', '/api/history'); assert.ok(!after.body.some(p => p.property_data?.code === property.code));
    for (const old of before.body.filter(p => p.property_data?.code !== property.code)) assert.ok(after.body.some(p => p.property_data?.code === old.property_data?.code));
    return { duplicateCount: match.length, serverTitleTrusted: true, unrelatedHistoryPreserved: true };
  });
  let expiring;
  await check('EXPIRY-01', 'Tin tự mất công khai khi qua thời điểm hết hạn', 'Edge', 'Tin công khai trước hạn, không công khai sau hạn mà không cần job nền', async () => {
    const expiresAt = Date.now() + 45000;
    const created = await http(admin, 'POST', '/api/properties', { title: `${run}-EXPIRY`, purpose: 'sale', type: property.type, property_type_id: property.property_type_id, price: '1000000000', area: '80', address: 'QA expiry fixture', expire_date: new Date(expiresAt).toISOString() });
    assert.equal(created.status, 201); expiring = created.body.data;
    const before = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(expiring.code)); assert.ok(before.body.some(p => p.id === expiring.id), 'Fixture expired before pre-expiry probe; timing inconclusive');
    const remaining = expiresAt + 1000 - Date.now(); if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
    const after = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(expiring.code)); assert.ok(!after.body.some(p => p.id === expiring.id)); return { id: expiring.id, expiresAt: expiring.expire_date, publicAfterExpiry: false };
  });
  await check('HISTORY-02', 'Chặn ghi lịch sử cho tin status=1 đã hết hạn', 'Edge', '404/422 khi tin không còn công khai', async () => {
    assert.ok(expiring, 'Dependent expiry fixture unavailable');
    const r = await http(poster, 'POST', '/api/history', { property: { code: expiring.code } }); assert.ok([404, 422].includes(r.status), JSON.stringify({ status: r.status, expiredHistoryAccepted: r.status === 200 })); return r.status;
  });
  await check('EXT-04', 'Gia hạn tin đã hết hạn lấy thời điểm hiện tại', 'Happy', 'Hạn mới gần thời điểm xử lý +2 ngày, tin công khai lại', async () => {
    assert.ok(expiring, 'Dependent expiry fixture unavailable'); const started = Date.now(); const r = await http(admin, 'POST', `/api/properties/${expiring.id}/extend`, { days: 2 }); const finished = Date.now(); assert.equal(r.status, 200);
    const expires = Date.parse(r.body.data.expire_date); assert.ok(expires >= started + 2 * 86400000 - 1000 && expires <= finished + 2 * 86400000 + 1000);
    const pub = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(expiring.code)); assert.ok(pub.body.some(p => p.id === expiring.id)); return { expireDate: r.body.data.expire_date, publicAgain: true };
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], apiCalls = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { const u = new URL(r.url()); if (u.origin === new URL(base).origin && u.pathname.startsWith('/api/')) apiCalls.push({ method: r.request().method(), path: u.pathname, status: r.status() }); });
  const heading = p => page.getByRole('heading', { name: p.title, exact: true });
  const card = p => page.locator('main div.group').filter({ has: page.getByRole('heading', { name: p.title, exact: true }) }).last();
  const detail = () => page.locator('.app-dialog-layer').filter({ has: page.locator('button[title="Chia sẻ liên kết"]') }).last();
  const closeDetail = async () => { if (await detail().count()) await detail().locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click(); };
  const titles = async () => (await page.locator('main h3').allTextContents()).map(t => t.trim()).filter(t => t.startsWith(run));
  const reset = async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await heading(property).waitFor({ timeout: 60000 });
  };
  const ui = async (id, feature, kind, expected, fn) => {
    const item = await check(id, feature, kind, expected, fn);
    if (item.status !== 'PASS') {
      const filename = `${id.toLowerCase()}.png`;
      await page.screenshot({ path: path.join(output, filename), fullPage: false }).then(() => { item.screenshot = filename; }).catch(() => {});
      write();
    }
    return item;
  };
  const applyCustom = async (kind, min, max) => {
    await page.getByRole('button', { name: kind === 'price' ? '+ Tự nhập giá' : '+ Tự nhập DT', exact: true }).click();
    const form = page.locator('.app-dialog-layer form').last();
    const inputs = form.locator('input[type="number"]');
    await inputs.nth(0).fill(min); await inputs.nth(1).fill(max);
    await form.getByRole('button', { name: kind === 'price' ? 'Áp dụng bộ lọc giá' : 'Áp dụng bộ lọc diện tích', exact: true }).click();
    await page.waitForTimeout(200);
  };
  try {
    await ui('UI-01', 'Tải catalog thực tế trên Chrome', 'Happy', 'Có đầy đủ các fixture công khai', async () => {
      await reset(); await heading(second).waitFor(); await heading(land).waitFor();
      results.browserEnvironment = { title: await page.title(), scripts: await page.locator('script[src]').evaluateAll(ns => ns.map(n => n.src)) };
      return { visibleFixtureTitles: await titles() };
    });
    await ui('UI-02', 'Lọc đồng thời loại, giá và diện tích', 'Happy', 'Chỉ các fixture thỏa tất cả điều kiện', async () => {
      await reset();
      const type = page.locator('select').filter({ has: page.locator('option[value="Căn hộ"]') });
      const area = page.locator('select').filter({ has: page.locator('option[value="80-120"]') });
      const price = page.locator('select').filter({ has: page.locator('option[value="3b-6b"]') });
      await type.selectOption('Căn hộ'); await area.selectOption('80-120'); await price.selectOption('3b-6b');
      const found = await titles(); assert.ok(found.includes(second.title)); assert.ok(!found.includes(property.title)); assert.ok(!found.includes(land.title)); return found;
    });
    await ui('UI-03', 'Sắp xếp giá tăng/giảm', 'Happy', '2,5 tỷ < 3 tỷ < 4 tỷ và ngược lại', async () => {
      await reset(); const sort = page.locator('select').filter({ has: page.locator('option[value="price-asc"]') });
      await sort.selectOption('price-asc'); let found = (await titles()).filter(t => [property.title, second.title, land.title].includes(t)); assert.deepEqual(found, [property.title, second.title, land.title]);
      await sort.selectOption('price-desc'); found = (await titles()).filter(t => [property.title, second.title, land.title].includes(t)); assert.deepEqual(found, [land.title, second.title, property.title]); return found;
    });
    await ui('UI-04', 'Sắp xếp diện tích và mới nhất', 'Happy', 'Đất 120 m² đứng trước căn hộ 100,25 khi giảm; tin tạo sau đứng trước', async () => {
      await reset(); const sort = page.locator('select').filter({ has: page.locator('option[value="area-desc"]') });
      await sort.selectOption('area-desc'); let found = await titles(); assert.ok(found.indexOf(land.title) < found.indexOf(property.title));
      await sort.selectOption('newest'); found = await titles(); assert.ok(found.indexOf(land.title) < found.indexOf(property.title)); return found.filter(t => [property.title, second.title, land.title].includes(t));
    });
    await ui('UI-05', 'Giá tùy chỉnh đủ hai đầu, gồm biên', 'Edge', 'Khoảng 2,5–3 tỷ chứa cả hai căn hộ QA', async () => {
      await reset(); await applyCustom('price', '2.5', '3'); const found = await titles(); assert.ok(found.includes(property.title) && found.includes(second.title) && !found.includes(land.title)); return found;
    });
    await ui('UI-06', 'Giá chỉ có tối thiểu', 'Edge', 'Giá từ 3 tỷ trở lên vẫn có căn hộ 3 tỷ và đất 4 tỷ', async () => {
      await reset(); await applyCustom('price', '3', ''); const found = await titles(); assert.ok(found.includes(second.title) && found.includes(land.title), JSON.stringify({ submitted: 'min=3 tỷ, max trống', found })); return found;
    });
    await ui('UI-07', 'Diện tích chỉ có tối thiểu', 'Edge', 'Từ 100 m² trở lên có các fixture 100,25 và 120 m²', async () => {
      await reset(); await applyCustom('area', '100', ''); const found = await titles(); assert.ok(found.includes(property.title) && found.includes(land.title), JSON.stringify({ submitted: 'min=100 m², max trống', found })); return found;
    });
    await ui('UI-08', 'Khoảng giá min lớn hơn max', 'Negative', 'Thông báo lỗi; không áp dụng bộ lọc sai', async () => {
      await reset(); let message = ''; page.once('dialog', async d => { message = d.message(); await d.accept(); });
      await applyCustom('price', '5', '3'); assert.match(message, /tối thiểu.*tối đa/); assert.ok(await page.locator('.app-dialog-layer form').count());
      await page.locator('.app-dialog-layer form').getByRole('button', { name: 'Hủy bỏ', exact: true }).click(); return message;
    });
    await ui('UI-09', 'Chi tiết dùng đúng mô tả BĐS', 'Happy', 'Hiển thị nội dung description do server lưu', async () => {
      await reset(); await heading(property).click(); await detail().waitFor();
      const text = await detail().innerText(); assert.ok(text.includes(property.description), JSON.stringify({ expectedDescription: property.description, found: text.includes(property.description) })); return { descriptionFound: true };
    });
    await ui('UI-10', 'Bản đồ chi tiết dùng tọa độ ghim', 'Happy', 'Iframe ưu tiên tọa độ fixture, không chỉ định vị quận/thành phố', async () => {
      await reset(); await heading(property).click(); const src = await detail().locator('iframe[title="Bản đồ vị trí"]').getAttribute('src');
      const q = new URL(src).searchParams.get('q'); assert.ok(q?.includes('10.7769') && q?.includes('106.7009'), JSON.stringify({ savedLat: property.lat, savedLng: property.lng, iframeQuery: q })); return q;
    });
    await ui('UI-11', 'Yêu thích thêm và giữ sau reload', 'Happy', 'Local storage có đúng một mục QA, danh sách mở đúng tin', async () => {
      await reset(); await card(property).locator('button[title="Lưu tin yêu thích"]').click();
      assert.equal(await page.evaluate(code => JSON.parse(localStorage.getItem('3tv_favorites') || '[]').filter(p => p.code === code).length, property.code), 1);
      await page.reload({ waitUntil: 'domcontentloaded' }); await heading(property).waitFor({ timeout: 60000 });
      await page.locator('button[title="Tin đăng đã lưu"]').click(); const favorites = page.locator('.app-dialog-layer').filter({ hasText: 'Danh Sách Tin Đăng Đã Lưu' }); assert.ok((await favorites.innerText()).includes(property.title));
      await favorites.getByRole('button', { name: 'Đóng', exact: true }).click(); return { persisted: true };
    });
    await ui('UI-12', 'So sánh hai căn hộ tương thích', 'Happy', 'Có hai cột và đúng giá/diện tích', async () => {
      await reset(); await card(property).locator('button[title="Thêm vào so sánh"]').click(); await card(second).locator('button[title="Thêm vào so sánh"]').click();
      const text = await page.locator('#compare-drawer').innerText(); assert.ok(text.includes(property.title) && text.includes(second.title)); assert.match(text, /2\/4/); return { count: 2 };
    });
    await ui('UI-13', 'So sánh đất nền với căn hộ', 'Negative', 'Chặn hoặc có thông báo không tương thích rõ ràng', async () => {
      let dialog = ''; const handler = async d => { dialog = d.message(); await d.accept(); }; page.on('dialog', handler);
      try {
        await card(land).locator('button[title="Thêm vào so sánh"]').click(); const text = await page.locator('#compare-drawer').innerText();
        assert.ok(!text.includes(land.title) || /khác loại|không tương thích|không thể so sánh/i.test(text + dialog), JSON.stringify({ mixedPropertyIncluded: text.includes(land.title), warning: dialog })); return { dialog };
      } finally { page.off('dialog', handler); }
    });
    await ui('UI-14', 'Giới hạn so sánh 4 tin', 'Edge', 'Thêm thứ 5 bị chặn, số cột không vượt 4', async () => {
      await reset(); const buttons = page.locator('main button[title="Thêm vào so sánh"]'); assert.ok(await buttons.count() >= 5); let message = '';
      const handler = async d => { message = d.message(); await d.accept(); }; page.on('dialog', handler);
      try { for (let i = 0; i < 5; i++) await buttons.nth(i).click(); } finally { page.off('dialog', handler); }
      const count = await page.locator('#compare-drawer thead th').count() - 1; assert.equal(count, 4); assert.match(message, /tối đa 4/); return { count, message };
    });
    await ui('UI-23', 'Copy link bằng clipboard thật', 'Happy', 'Clipboard chứa URL đúng code và không chứa token', async () => {
      await reset(); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
      await card(property).locator('button[title="Chia sẻ link"]').click();
      const copied = await page.evaluate(() => navigator.clipboard.readText()); const url = new URL(copied); assert.equal(url.searchParams.get('property'), property.code); assert.equal(url.origin, new URL(base).origin); assert.ok(!/[?&](token|password|authorization)=/i.test(copied)); return { copiedUrl: copied };
    });
    await ui('UI-15', 'Clipboard thất bại trên card', 'Negative', 'Không báo đã chép khi writeText bị từ chối', async () => {
      await reset(); await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('QA clipboard denied'); } } }));
      await card(property).locator('button[title="Chia sẻ link"]').click();
      const text = await card(property).innerText(); assert.ok(!text.includes('Đã chép link!'), JSON.stringify({ falseSuccess: text.includes('Đã chép link!') })); return text.slice(-200);
    });
    await ui('UI-16', 'Link chia sẻ mở đúng tin', 'Happy', 'URL ?property mở đúng modal cho khách', async () => {
      await page.goto(`${base}/?property=${encodeURIComponent(property.code)}`, { waitUntil: 'domcontentloaded' }); await detail().waitFor({ timeout: 60000 });
      assert.ok((await detail().innerText()).includes(property.code)); return { openedCode: property.code };
    });
    await ui('UI-17', 'Đóng modal từ link chia sẻ', 'Edge', 'Modal giữ đóng sau catalog refresh', async () => {
      await closeDetail(); assert.equal(await detail().count(), 0);
      await page.waitForResponse(r => new URL(r.url()).pathname === '/api/properties' && r.status() === 200, { timeout: 35000 }); await page.waitForTimeout(300);
      const reopened = await detail().count(); assert.equal(reopened, 0, JSON.stringify({ modalReopenedAfterRefresh: Boolean(reopened) })); return { reopened: false };
    });
    await ui('UI-18', 'Lịch sử xem ghi nhận và khử trùng', 'Happy', 'Xem lại một tin chỉ có một mục, mới nhất đứng đầu', async () => {
      await reset(); await heading(property).click(); await closeDetail(); await heading(second).click(); await closeDetail(); await heading(property).click(); await closeDetail();
      const history = await page.evaluate(() => JSON.parse(localStorage.getItem('3tv_recent_views') || '[]'));
      assert.equal(history[0].code, property.code); assert.equal(history.filter(p => p.code === property.code).length, 1); return { firstCode: history[0].code, matchingCount: 1 };
    });
    await ui('UI-19', 'Tin bị ẩn vẫn mở từ yêu thích', 'Edge', 'Không mở lại nội dung snapshot đã mất quyền công khai', async () => {
      await reset(); const stored = await page.evaluate(code => JSON.parse(localStorage.getItem('3tv_favorites') || '[]').some(p => p.code === code), property.code);
      if (!stored) await card(property).locator('button[title="Lưu tin yêu thích"]').click();
      await setStatus(property.id, 4, 'QA hide favorite edge');
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await heading(property).waitFor({ state: 'detached', timeout: 45000 });
      const pub = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(property.code)); assert.ok(!pub.body.some(p => p.id === property.id));
      await page.locator('button[title="Tin đăng đã lưu"]').click(); const favorites = page.locator('.app-dialog-layer').filter({ hasText: 'Danh Sách Tin Đăng Đã Lưu' });
      const row = favorites.locator('div').filter({ has: page.getByRole('heading', { name: property.title, exact: true }) }).filter({ has: page.getByRole('button', { name: 'Xem', exact: true }) }).last();
      if (await row.count()) await row.getByRole('button', { name: 'Xem', exact: true }).click();
      const leaked = await detail().count() && (await detail().innerText()).includes(property.code); assert.ok(!leaked, JSON.stringify({ publicCatalogContains: false, privateSnapshotReopened: Boolean(leaked) })); return { privateSnapshotReopened: false };
    });
    await setStatus(property.id, 1, 'QA restore after favorite test');
    await ui('UI-20', 'Tin bị xóa khi đang so sánh', 'Edge', 'Không tiếp tục hiển thị/mở nội dung tin đã xóa', async () => {
      await reset(); await card(property).locator('button[title="Thêm vào so sánh"]').click(); await card(second).locator('button[title="Thêm vào so sánh"]').click();
      const deleted = await http(admin, 'DELETE', `/api/properties/${property.id}`); assert.equal(deleted.status, 200);
      await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await heading(property).waitFor({ state: 'detached', timeout: 45000 });
      const oldColumn = page.locator('#compare-drawer th').filter({ hasText: property.title });
      if (await oldColumn.count()) await oldColumn.getByRole('button', { name: 'Xem chi tiết →', exact: true }).click();
      const leaked = await detail().count() && (await detail().innerText()).includes(property.code); assert.ok(!leaked, JSON.stringify({ deletedPropertySnapshotReopened: Boolean(leaked) })); return { deletedPropertySnapshotReopened: false };
    });
    await http(admin, 'PATCH', `/api/properties/${property.id}/restore`); await setStatus(property.id, 1);
    await ui('UI-21', 'Bản đồ danh sách khi tile lỗi', 'Edge', 'Có thông báo lỗi/thử lại, không để bản đồ trắng im lặng', async () => {
      await reset(); let failures = 0; await page.route(/https:\/\/[^/]*tile\.openstreetmap\.org\//, async route => { failures++; await route.abort('failed'); });
      try {
        await page.locator('button[title="Xem trên bản đồ"]').click(); await page.locator('.leaflet-container').waitFor(); await page.waitForTimeout(1200);
        assert.ok(failures > 0, 'Tile failure injection did not match provider; case not verified');
        const text = await page.locator('main').innerText(); const message = /không.*tải.*bản đồ|lỗi.*bản đồ|thử lại.*bản đồ/i.test(text);
        assert.ok(message, JSON.stringify({ tileRequestsAborted: failures, errorFallbackVisible: message })); return { failures, message };
      } finally { await page.unroute(/https:\/\/[^/]*tile\.openstreetmap\.org\//); }
    });
    await ui('UI-22', 'URL tin chờ duyệt không mở công khai', 'Security', 'Không có modal/chi tiết fixture khi status=0', async () => {
      await setStatus(property.id, 0, 'QA pending direct URL');
      await page.goto(`${base}/?property=${encodeURIComponent(property.code)}`, { waitUntil: 'domcontentloaded' });
      await page.waitForResponse(r => new URL(r.url()).pathname === '/api/properties' && r.status() === 200, { timeout: 45000 }); await page.waitForTimeout(300);
      assert.equal(await detail().count(), 0); return { modalCount: 0 };
    });
    await setStatus(property.id, 1);
  } finally {
    results.browserErrors = errors; results.browserApiResponses = apiCalls; write(); await ctx.close();
  }
}
