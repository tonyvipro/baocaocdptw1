import assert from 'node:assert/strict';
import { searchProperties, rankSearchCatalog } from '../src/services/propertySearch.js';
import { filterCatalog } from '../src/utils/propertyCatalog.js';

const controller = new AbortController();
const result = { data: [{ id: 7, title: 'Biệt thự Thảo Điền' }], meta: { current_page: 2, last_page: 3 } };
const fetcher = async (url, options) => {
  const params = new URL(url, 'http://localhost').searchParams;
  assert.equal(params.get('q'), 'thao & dien');
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('per_page'), '8');
  assert.equal(options.signal, controller.signal);
  assert.equal(options.headers.Accept, 'application/json');
  return { ok: true, json: async () => result };
};
assert.deepEqual(await searchProperties('  thao & dien  ', { page: 2, signal: controller.signal, fetcher }), result);
assert.deepEqual(await searchProperties('missing', { fetcher: async () => ({ ok: true, json: async () => ({ data: [], meta: { total: 0 } }) }) }), { data: [], meta: { total: 0 } });
await assert.rejects(searchProperties('test', { fetcher: async () => ({ ok: false, json: async () => ({ message: 'Dịch vụ tìm kiếm đang tạm gián đoạn.' }) }) }), /tạm gián đoạn/);
await assert.rejects(searchProperties('test', { fetcher: async () => ({ ok: true, json: async () => ({ data: '<html>' }) }) }), /không hợp lệ/);
await assert.rejects(searchProperties('test', { fetcher: async () => ({ ok: false, json: async () => { throw new SyntaxError(); } }) }), /Không thể tải/);
await assert.rejects(searchProperties('test', { fetcher: async () => { throw new DOMException('Cancelled', 'AbortError'); } }), error => error.name === 'AbortError');
const idsResult = { data: [2, 1], meta: { total: 2, limit: 1000 } };
assert.deepEqual(await searchProperties('vinhomez', { catalog: true, fetcher: async url => {
  const params = new URL(url, 'http://localhost').searchParams;
  assert.equal(params.get('catalog'), '1');
  assert.equal(params.has('per_page'), false);
  return { ok: true, json: async () => idsResult };
} }), idsResult);
await assert.rejects(searchProperties('test', { catalog: true, fetcher: async () => ({ ok: true, json: async () => result }) }), /không hợp lệ/);
const catalog = [
  { id: '1', title: 'Vinhomes', project: 'Park', city: 'Hồ Chí Minh', purpose: 'sale', price: 2e9, area: 80, status: 1 },
  { id: 2, title: 'Vinhomes', project: 'Garden', city: 'Hà Nội', purpose: 'rent', price: 12e6, area: 65, status: 1 },
];
const ranked = rankSearchCatalog(catalog, [2, 999, 1]);
assert.deepEqual(ranked.map(property => property.id), [2, '1']);
assert.deepEqual(filterCatalog(ranked, { project: 'Park', city: 'Hồ Chí Minh', price: 'under-3b', area: '50-100', purpose: 'sale' }), [catalog[0]]);
assert.deepEqual(rankSearchCatalog(catalog, []), []);
console.log('PASS: search requests, errors, catalog ranking and combined project/city/purpose/price/area filters.');
