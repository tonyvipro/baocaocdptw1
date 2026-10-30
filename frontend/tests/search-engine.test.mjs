import assert from 'node:assert/strict';
import { filterCatalog } from '../src/utils/propertyCatalog.js';

const listing = { code: 'SALE-1', title: 'Biệt thự Thảo Điền', address: 'Nguyễn Văn Hưởng', city: 'Hồ Chí Minh', status: 1 };
for (const search of ['THAO dien', ' nguyen   biet ', 'SALE-1', 'hồ thự']) {
  assert.equal(filterCatalog([listing], { search }).length, 1, search);
}
for (const search of ['missing', '%', '_', "' OR 1=1 --"]) {
  assert.equal(filterCatalog([listing], { search }).length, 0, search);
}
assert.equal(filterCatalog([{ ...listing, status: 4 }], { search: 'thao' }).length, 0);
assert.equal(filterCatalog([listing], { search: '   ' }).length, 1);
console.log('Search engine regression tests passed.');

if (process.argv.includes('--live')) {
  const base = process.env.API_BASE_URL || 'http://127.0.0.1:8080';
  const response = await fetch(`${base}/api/properties`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('x-request-id'));
  const catalog = await response.json();
  assert.ok(Array.isArray(catalog));
  if (catalog.length) {
    const code = catalog[0].code;
    const result = await fetch(`${base}/api/properties?search=${encodeURIComponent(code)}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(result.status, 200);
    const matches = await result.json();
    assert.ok(matches.some(property => property.code === code), 'Live search must find the selected listing');
    console.log(`Live database search passed (${matches.length} matches).`);
  } else {
    console.log('Live database catalog is empty; listing lookup skipped.');
  }
}
