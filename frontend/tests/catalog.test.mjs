import assert from 'node:assert/strict';
import { filterCatalog, loadCatalog, priceMatches, areaMatches } from '../src/utils/propertyCatalog.js';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const villa = { id: 22, code: 'SAL-OPUZ-854', title: 'Test BĐS Biệt Thự Thảo Điền Quận 2', address: '12 Nguyễn Văn Hưởng', type: 'Biệt thự đơn lập', purpose: 'sale', price: '25000000000', bedrooms: '5', area: 300, status: 1 };
for (const search of ['test', '  TEST  ', 'thao dien', 'biệt thự', 'nguyen van huong', 'SAL-OPUZ-854']) {
  assert.equal(filterCatalog([villa], { search }).length, 1, search);
}
assert.equal(filterCatalog([villa], { type: 'biet-thu', bedrooms: '4', price: '20b-30b', area: 'above-200' }).length, 1);
for (const status of [0, 2, 3, 4]) assert.equal(filterCatalog([{ ...villa, status }]).length, 0);
assert.equal(filterCatalog([{ ...villa, expire_date: '2000-01-01 00:00:00' }]).length, 0);
assert.equal(filterCatalog([{ ...villa, deleted_at: '2026-01-01' }]).length, 0);
assert.equal(priceMatches({ purpose: 'rent', price: 10e6 }, 'under-3b'), false);
assert.equal(priceMatches({ purpose: 'sale', price: 3e9 }, '1b-3b'), false);
assert.equal(priceMatches({ purpose: 'sale', price: 3e9 }, '3b-5b'), true);
assert.equal(priceMatches(villa, 'custom:0-0'), false);
assert.equal(priceMatches(villa, 'custom:30000000000-1000000000'), false);
assert.equal(areaMatches({ area: null }, 'under-50'), false);
assert.equal(areaMatches({ area: 80 }, '50-80'), false);
assert.equal(areaMatches({ area: 80 }, '80-120'), true);
const rent = { ...villa, id: 23, purpose: 'rent', price_sale: 99e9, price_rent: '15000000' };
assert.equal(filterCatalog([villa, rent], { sort: 'price-asc' })[0].id, 23);

let calls = 0;
const retryClient = { async get(url, config) { calls++; assert.ok(url.startsWith('/api/properties?')); assert.ok(config.timeout > 3000); if (calls === 1) throw new Error('temporary outage'); return { data: [villa] }; } };
assert.equal((await loadCatalog(retryClient)).data[0].id, 22);
assert.equal(calls, 2);
assert.deepEqual((await loadCatalog({ get: async () => ({ data: [] }) })).data, []);
await assert.rejects(loadCatalog({ get: async () => { throw new Error('offline'); } }), /Không tải được/);
await assert.rejects(loadCatalog({ get: async () => ({ data: '<html>error</html>' }) }), /Không tải được/);
assert.equal((await loadCatalog({ get: async () => ({ data: { data: [villa] } }) })).data.length, 1);

// Parse and inspect the actual deployed bundle, not only src.
const assets = new URL('../dist/assets/', import.meta.url);
const name = readdirSync(assets).find(n => /^index-[\w-]+\.js$/.test(n));
const bundle = readFileSync(new URL(name, assets), 'utf8');
parse(bundle, { sourceType: 'module' });
assert.ok(bundle.includes('filterCatalog(n,{purpose:$,search:C'));
assert.ok(bundle.includes('const Ih=()=>loadCatalog(Ue)'));
assert.ok(!bundle.includes('source:"local"}},Rh='));
assert.equal(readFileSync(new URL('property-catalog.js', assets), 'utf8'), readFileSync(new URL('../src/utils/propertyCatalog.js', import.meta.url), 'utf8'));

if (process.argv.includes('--live')) {
  const response = await fetch('http://localhost:3000/api/properties', { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200);
  const properties = await response.json();
  const found = filterCatalog(properties, { search: 'test' });
  assert.ok(found.some(p => p.code === villa.code), 'The reported property must be searchable in the live catalog');
  console.log(`LIVE PASS: ${properties.length} properties; search test finds ${found.map(p => p.code).join(', ')}`);
  assert.ok((await (await fetch('http://localhost:3000/assets/property-catalog.js')).text()).includes('export function loadCatalog'));
}
console.log('PASS: catalog search, filters, visibility, retry, empty/error responses and deployed bundle');
