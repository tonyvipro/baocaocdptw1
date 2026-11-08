import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium, request } = require(path.join(root, 'frontend/node_modules/.audit-browser/node_modules/playwright'));
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const output = path.join(root, 'docs/qa-live-2026-11-08');
fs.mkdirSync(output, { recursive: true });
const run = `QA-LIVE-${Date.now()}`;
const results = { run, base, startedAt: new Date().toISOString(), mode: 'real HTTP and real browser; no mocked application API responses', checks: [], requests: [], fixtures: [], categories: [], cleanup: [] };
const write = () => fs.writeFileSync(path.join(output, 'live-results.json'), JSON.stringify(results, null, 2));
const cleanText = value => String(value ?? '').slice(0, 1500);
async function check(id, feature, kind, expected, fn) {
  const item = { id, feature, kind, expected, startedAt: new Date().toISOString() };
  try { item.actual = await fn(); item.status = 'PASS'; }
  catch (error) { item.status = error.blocked ? 'BLOCKED' : 'FAIL'; item.actual = cleanText(error.message); }
  results.checks.push(item); write();
  console.log(`${item.status} ${id} ${feature}: ${typeof item.actual === 'object' ? JSON.stringify(item.actual) : item.actual}`);
  return item;
}
function needed(value, message) { if (!value) { const e = new Error(message); e.blocked = true; throw e; } return value; }
async function http(context, method, endpoint, data) {
  const started = Date.now();
  const res = await context.fetch(base + endpoint, { method, ...(data === undefined ? {} : { data }), timeout: 45000 });
  const raw = await res.text(); let body; try { body = JSON.parse(raw); } catch { body = raw; }
  const entry = { method, endpoint, status: res.status(), ms: Date.now() - started };
  if (res.status() >= 400) entry.error = typeof body === 'object' ? { message: body.message, errors: body.errors } : cleanText(raw).slice(0, 300);
  results.requests.push(entry); write();
  if (method === 'POST' && endpoint === '/api/properties' && body?.data?.id) {
    results.fixtures.push({ id: body.data.id, code: body.data.code, title: body.data.title }); write();
  }
  if (method === 'POST' && endpoint === '/api/property-types' && body?.data?.id) {
    results.categories.push(body.data.id); write();
  }
  return { status: res.status(), body, headers: res.headers() };
}
const contexts = [];
async function context(extra = {}) { const c = await request.newContext({ extraHTTPHeaders: { Accept: 'application/json', ...extra }, ignoreHTTPSErrors: false }); contexts.push(c); return c; }
const guest = await context(), poster = await context(), admin = await context();
let posterInfo, adminInfo, adminToken, property, second, land, category, child;
let browser;
const payload = (suffix, changes = {}) => ({ title: `${run}-${suffix}`, purpose: 'sale', type: category?.name || 'Căn hộ cao cấp', ...(category?.id ? { property_type_id: category.id } : {}), price: '2500000000', area: '100.25', address: '123 Đường QA, Thành phố Thủ Đức', street: '123 Đường QA', district: 'Thủ Đức', city: 'TP. Hồ Chí Minh', lat: '10.7769', lng: '106.7009', description: 'Nội dung mô tả QA riêng biệt để kiểm tra dữ liệu thực tế.', owner_name: 'QA Test Fixture', ...changes });
const create = async (who, suffix, changes = {}) => { const r = await http(who, 'POST', '/api/properties', payload(suffix, changes)); assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.data; };
const getManaged = async id => { const r = await http(admin, 'GET', '/api/properties?admin=1&status=all&search=' + encodeURIComponent(run) + '&per_page=100'); assert.equal(r.status, 200); return r.body.data.find(p => p.id === id); };
const setStatus = (id, status, reason = 'QA live state transition') => http(admin, 'PATCH', `/api/properties/${id}/status`, { status, reason });
try {
  await Promise.all([
    check('AUTH-01', 'Đăng nhập Poster', 'Happy', '200; tài khoản hoạt động, không phải Admin', async () => {
      const r = await http(poster, 'POST', '/api/login', { email: needed(process.env.QA_USER_EMAIL, 'Missing QA_USER_EMAIL'), password: needed(process.env.QA_USER_PASSWORD, 'Missing QA_USER_PASSWORD') });
      assert.equal(r.status, 200); posterInfo = r.body.user; assert.notEqual(Number(posterInfo.role_id), 1); return { id: posterInfo.id, role_id: posterInfo.role_id };
    }),
    check('AUTH-02', 'Đăng nhập Admin', 'Happy', '200; role_id=1', async () => {
      const r = await http(admin, 'POST', '/api/login', { email: needed(process.env.QA_ADMIN_EMAIL, 'Missing QA_ADMIN_EMAIL'), password: needed(process.env.QA_ADMIN_PASSWORD, 'Missing QA_ADMIN_PASSWORD') });
      assert.equal(r.status, 200); adminInfo = r.body.user; adminToken = r.body.token; assert.equal(Number(adminInfo.role_id), 1); return { id: adminInfo.id, role_id: adminInfo.role_id };
    }),
    check('SEC-01', 'Guest truy cập nhánh quản trị', 'Security', '401/403; không trả tin hạn chế', async () => {
      const r = await http(guest, 'GET', '/api/properties?admin=1&status=all&per_page=1');
      const evidence = { status: r.status, total: r.body?.meta?.total, returned: r.body?.data?.length, fields: Object.keys(r.body?.data?.[0] || {}) };
      assert.ok([401, 403].includes(r.status), JSON.stringify(evidence)); return evidence;
    }),
    check('SEC-02', 'Guest truy cập thống kê quản trị', 'Security', '401/403; không lộ tên DB', async () => {
      const r = await http(guest, 'GET', '/api/properties/stats');
      const evidence = { status: r.status, fields: Object.keys(r.body || {}), databaseHeaderPresent: Boolean(r.headers['x-database-name']) };
      assert.ok([401, 403].includes(r.status) && !evidence.databaseHeaderPresent, JSON.stringify(evidence)); return evidence;
    }),
    check('SEC-03', 'Guest truy cập danh sách của chủ tin', 'Security', '401', async () => {
      const r = await http(guest, 'GET', '/api/properties?mine=1'); assert.equal(r.status, 401); return r.status;
    }),
  ]);
  needed(adminInfo, 'Admin login failed'); needed(posterInfo, 'Poster login failed');
  await check('AUTH-03', 'Bearer token quản trị không kèm cookie', 'Negative', 'Token đăng nhập hợp lệ được nhận diện', async () => {
    const tokenOnly = await context({ Authorization: `Bearer ${needed(adminToken, 'No admin token')}` });
    const r = await http(tokenOnly, 'GET', '/api/properties/trash'); assert.equal(r.status, 200, `Bearer-only returned ${r.status}`); return r.status;
  });
  await check('TYPE-01', 'Tạo danh mục QA', 'Happy', '201; danh mục lưu đúng', async () => {
    const r = await http(admin, 'POST', '/api/property-types', { name: `${run}-Căn hộ`, slug: run.toLowerCase(), status: 1 });
    assert.equal(r.status, 201, JSON.stringify(r.body)); category = r.body.data; return { id: category.id, name: category.name };
  });
  needed(category, 'Cannot create isolated QA category');
  await check('TYPE-02', 'Poster không được tạo danh mục', 'Negative', '403', async () => {
    const r = await http(poster, 'POST', '/api/property-types', { name: `${run}-unauthorized`, slug: `${run.toLowerCase()}-unauthorized`, status: 1 }); assert.equal(r.status, 403); return r.status;
  });
  await check('TYPE-03', 'Chặn chu trình danh mục', 'Negative', '422; không tạo vòng lặp cha–con', async () => {
    const r = await http(admin, 'POST', '/api/property-types', { name: `${run}-child`, slug: `${run.toLowerCase()}-child`, parent_id: category.id, status: 1 }); assert.equal(r.status, 201); child = r.body.data;
    const cycle = await http(admin, 'PUT', `/api/property-types/${category.id}`, { name: category.name, slug: category.slug, parent_id: child.id, status: 1 }); assert.equal(cycle.status, 422); return cycle.status;
  });
  await check('CREATE-01', 'Poster tạo tin chờ duyệt', 'Happy', '201; status=0; chủ tin từ session', async () => {
    property = await create(poster, 'PRIMARY', { user_id: adminInfo.id, status: 1 }); assert.equal(property.status, 0); assert.equal(property.user_id, posterInfo.id); return { id: property.id, code: property.code, status: property.status };
  });
  needed(property, 'No primary QA property');
  await check('SEC-04', 'Khách không thấy tin chờ duyệt công khai', 'Edge', 'Catalog công khai không trả fixture chờ duyệt', async () => {
    const r = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(property.code)); assert.equal(r.status, 200); assert.ok(Array.isArray(r.body)); assert.ok(!r.body.some(p => p.id === property.id)); return { status: r.status, count: r.body.length };
  });
  await check('SEC-05', 'Khách lấy tin chờ duyệt qua admin=1', 'Security', '401/403; không trả fixture', async () => {
    const r = await http(guest, 'GET', `/api/properties?admin=1&status=0&search=${encodeURIComponent(property.code)}`); const found = r.body?.data?.some(p => p.id === property.id); assert.ok([401, 403].includes(r.status) && !found, JSON.stringify({ status: r.status, fixtureExposed: found })); return r.status;
  });
  await check('STATUS-01', 'Poster không tự duyệt tin', 'Negative', '403', async () => {
    const r = await http(poster, 'PATCH', `/api/properties/${property.id}/status`, { status: 1 }); assert.equal(r.status, 403); return r.status;
  });
  await check('MOD-01', 'Lưu lý do từ chối sau đọc lại', 'Happy', 'Lý do được lưu trong rejection_reason', async () => {
    const reason = `${run}: thiếu thông tin pháp lý`; const r = await setStatus(property.id, 4, reason); assert.equal(r.status, 200);
    const saved = await getManaged(property.id); assert.equal(saved.rejection_reason, reason, JSON.stringify({ status: saved.status, rejection_reason: saved.rejection_reason })); return { status: saved.status, rejection_reason: saved.rejection_reason };
  });
  await check('MOD-02', 'Bulk từ chối bắt buộc lý do', 'Negative', '422 khi reject thiếu reason', async () => {
    const r = await http(admin, 'POST', '/api/properties/bulk-action', { ids: [property.id], action: 'reject' }); assert.equal(r.status, 422, `reject without reason returned ${r.status}`); return r.status;
  });
  await check('MOD-03', 'Sửa và gửi lại rồi Admin phê duyệt', 'Happy', 'Poster update về 0; Admin approve về 1; công khai thấy tin', async () => {
    const edit = await http(poster, 'PUT', `/api/properties/${property.id}`, { description: 'QA đã bổ sung thông tin pháp lý.' }); assert.equal(edit.status, 200); assert.equal(edit.body.data.status, 0);
    const approve = await setStatus(property.id, 1); assert.equal(approve.status, 200); assert.equal(approve.body.data.status, 1); property = approve.body.data;
    const pub = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(property.code)); assert.ok(pub.body.some(p => p.id === property.id)); return { status: property.status };
  });
  await check('OWN-01', 'Poster không sửa/xóa tin Admin', 'Security', '403 cho cả sửa và xóa', async () => {
    second = await create(admin, 'SECOND', { price: '900000000', area: '60' });
    const edit = await http(poster, 'PUT', `/api/properties/${second.id}`, { price: '1' }); const del = await http(poster, 'DELETE', `/api/properties/${second.id}`); assert.equal(edit.status, 403); assert.equal(del.status, 403); return [edit.status, del.status];
  });
  await check('CREATE-02', 'Khách không được tạo tin', 'Negative', '401; không tạo bản ghi', async () => { const r = await http(guest, 'POST', '/api/properties', payload('GUEST')); assert.equal(r.status, 401); return r.status; });
  const invalids = [
    ['VAL-01', 'Giá âm', { price: '-1' }], ['VAL-02', 'Diện tích có chữ', { area: 'abc' }],
    ['VAL-03', 'Thiếu tiêu đề', { title: undefined }], ['VAL-04', 'Thiếu diện tích', { area: undefined }],
    ['VAL-05', 'Giá vượt giới hạn', { price: '10000000000000' }], ['VAL-06', 'Giá vượt BIGINT', { price: '9223372036854775808' }],
    ['VAL-07', 'Diện tích quá độ chính xác', { area: '12.345' }], ['VAL-08', 'Ký pháp số mũ', { price: '1e9' }],
    ['VAL-09', 'Tiêu đề 251 ký tự', { title: 'Đ'.repeat(251) }], ['VAL-10', 'Thiếu giá cố định', { price: undefined, price_sale: undefined }],
    ['VAL-11', 'Loại BĐS không tồn tại', { type: `${run}-UNKNOWN`, property_type_id: null }],
    ['VAL-12', 'Tọa độ ngoài vùng Việt Nam', { lat: '35.6762', lng: '139.6503' }],
    ['VAL-13', 'Chỉ có một thành phần tọa độ', { lat: '10.7769', lng: null }],
  ];
  for (const [id, feature, changes] of invalids) await check(id, feature, 'Negative', '422; không tạo tin không hợp lệ', async () => {
    const r = await http(admin, 'POST', '/api/properties', payload(id, changes)); assert.equal(r.status, 422, JSON.stringify({ status: r.status, createdId: r.body?.data?.id, price: r.body?.data?.price, type: r.body?.data?.type, lat: r.body?.data?.lat, lng: r.body?.data?.lng })); return { status: r.status, fields: Object.keys(r.body.errors || {}) };
  });
  await check('UPDATE-01', 'Sửa thông tin BĐS và giá tiền tỷ', 'Happy', 'Giá 3 tỷ và diện tích 100,25 lưu chính xác', async () => {
    const r = await http(admin, 'PUT', `/api/properties/${second.id}`, { price: '3000000000', area: '100.25' }); assert.equal(r.status, 200); assert.equal(Number(r.body.data.price), 3000000000); assert.equal(Number(r.body.data.area), 100.25); second = r.body.data; return { price: second.price, area: second.area };
  });
  await check('AREA-01', 'Round-trip diện tích lớn có 2 số lẻ', 'Edge', '99999999.99 được giữ nguyên nếu API chấp nhận', async () => {
    const r = await http(admin, 'PUT', `/api/properties/${second.id}`, { area: '99999999.99' }); assert.equal(r.status, 200); const saved = await getManaged(second.id); assert.equal(Number(saved.area), 99999999.99, JSON.stringify({ submitted: '99999999.99', persisted: saved.area })); return saved.area;
  });
  await http(admin, 'PUT', `/api/properties/${second.id}`, { area: '100.25' });
  await check('TYPE-04', 'Không xóa danh mục đang có tin', 'Negative', '422; quan hệ được giữ', async () => { const r = await http(admin, 'DELETE', `/api/property-types/${category.id}`); assert.equal(r.status, 422); return r.status; });
  await check('EXT-01', 'Gia hạn tin còn hạn', 'Happy', 'Hạn cũ +30 ngày, không mất thời gian còn lại', async () => {
    const before = await getManaged(property.id); const r = await http(poster, 'POST', `/api/properties/${property.id}/extend`, { days: 30, note: `${run} extension` }); assert.equal(r.status, 200);
    assert.equal(Date.parse(r.body.data.expire_date) - Date.parse(before.expire_date), 30 * 86400000); property = r.body.data; return { before: before.expire_date, after: property.expire_date };
  });
  await check('EXT-02', 'Thời lượng gia hạn không hợp lệ', 'Negative', '422 cho 0, âm và vượt 3650', async () => { const statuses = []; for (const days of [0, -1, 3651]) { const r = await http(poster, 'POST', `/api/properties/${property.id}/extend`, { days }); statuses.push(r.status); assert.equal(r.status, 422); } return statuses; });
  await check('EXT-03', 'Gia hạn không tự hiển thị tin ẩn', 'Edge', 'Hạn tăng; status vẫn 4; catalog không trả tin', async () => {
    await setStatus(property.id, 4); const r = await http(poster, 'POST', `/api/properties/${property.id}/extend`, { days: 1 }); assert.equal(r.status, 200); assert.equal(r.body.data.status, 4);
    const pub = await http(guest, 'GET', '/api/properties?search=' + encodeURIComponent(property.code)); assert.ok(!pub.body.some(p => p.id === property.id)); return { status: r.body.data.status };
  });
  await check('SEC-06', 'Khách lấy tin ẩn qua admin=1', 'Security', '401/403; không trả fixture ẩn', async () => {
    const r = await http(guest, 'GET', '/api/properties?admin=1&status=4&search=' + encodeURIComponent(property.code)); const found = r.body?.data?.some(p => p.id === property.id); assert.ok([401, 403].includes(r.status) && !found, JSON.stringify({ status: r.status, hiddenFixtureExposed: found })); return r.status;
  });
  await check('DELETE-01', 'Xóa mềm và thùng rác', 'Happy', 'Tin rời catalog và có trong thùng rác, dữ liệu vẫn còn', async () => {
    const r = await http(poster, 'DELETE', `/api/properties/${property.id}`); assert.equal(r.status, 200); const trash = await http(admin, 'GET', '/api/properties/trash'); assert.ok(trash.body.data.some(p => p.id === property.id)); return { status: r.status, inTrash: true };
  });
  await check('DELETE-02', 'Poster không hard delete/restore', 'Negative', '403', async () => {
    const hard = await http(poster, 'DELETE', `/api/properties/${property.id}/force`); const restore = await http(poster, 'PATCH', `/api/properties/${property.id}/restore`); assert.equal(hard.status, 403); assert.equal(restore.status, 403); return [hard.status, restore.status];
  });
  await check('RESTORE-01', 'Admin khôi phục giữ trạng thái ẩn', 'Happy', '200; dữ liệu, chủ tin và trạng thái được giữ', async () => {
    const r = await http(admin, 'PATCH', `/api/properties/${property.id}/restore`); assert.equal(r.status, 200); assert.equal(r.body.data.status, 4); assert.equal(r.body.data.user_id, posterInfo.id); assert.equal(r.body.data.code, property.code); return { status: r.body.data.status, deleted_at: r.body.data.deleted_at };
  });
  await check('DELETE-03', 'Hard delete chỉ áp dụng tin trong thùng rác', 'Negative', '422', async () => { const r = await http(admin, 'DELETE', `/api/properties/${property.id}/force`); assert.equal(r.status, 422); return r.status; });
  await check('BULK-01', 'Bulk rollback khi có ID không tồn tại', 'Edge', '404; tin QA đầu tiên không bị xóa một phần', async () => {
    const r = await http(admin, 'POST', '/api/properties/bulk-action', { ids: [property.id, 2147483647], action: 'delete' }); assert.equal(r.status, 404); const saved = await getManaged(property.id); assert.ok(saved && !saved.deleted_at); return { status: r.status, existingFixturePreserved: true };
  });
  await setStatus(property.id, 1); property = await getManaged(property.id);
  land = await create(admin, 'LAND', { type: 'Đất nền dự án', property_type_id: 5, price: '4000000000', area: '120' });
  // Only our own fixtures are used for destructive browser interactions.
  results.browserFixtures = { property, second, land }; write();
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const { runBrowserChecks } = await import('./live-real-estate-browser.mjs');
  await runBrowserChecks({ browser, request, base, output, run, results, write, check, http, admin, poster, guest, property, second, land, setStatus, getManaged });
} catch (error) {
  results.fatal = cleanText(error.stack); console.log('RUN FATAL', results.fatal); write();
} finally {
  if (browser) await browser.close().catch(() => {});
  // Delete only IDs created by this run; never delete baseline or linked business data.
  for (const fixture of [...results.fixtures].reverse()) {
    try {
      const del = await http(admin, 'DELETE', `/api/properties/${fixture.id}`);
      const hard = await http(admin, 'DELETE', `/api/properties/${fixture.id}/force`);
      results.cleanup.push({ kind: 'property', id: fixture.id, softStatus: del.status, hardStatus: hard.status }); write();
    } catch (error) { results.cleanup.push({ kind: 'property', id: fixture.id, error: cleanText(error.message) }); write(); }
  }
  for (const id of [...results.categories].reverse()) {
    try { const r = await http(admin, 'DELETE', `/api/property-types/${id}`); results.cleanup.push({ kind: 'category', id, status: r.status }); write(); }
    catch (error) { results.cleanup.push({ kind: 'category', id, error: cleanText(error.message) }); write(); }
  }
  for (const [name, who] of [['poster', poster], ['admin', admin]]) {
    try { const r = await http(who, 'POST', '/api/logout'); results.cleanup.push({ kind: 'logout', actor: name, status: r.status }); } catch {}
  }
  for (const c of contexts) await c.dispose().catch(() => {});
  results.finishedAt = new Date().toISOString();
  results.summary = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED'].map(status => [status, results.checks.filter(c => c.status === status).length])); write();
  console.log('SUMMARY', JSON.stringify(results.summary), 'requests', results.requests.length, 'cleanup', JSON.stringify(results.cleanup));
}
