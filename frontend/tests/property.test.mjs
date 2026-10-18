import assert from 'node:assert/strict';
import { matchesPrice, normalizeSearch, validCoordinates, readPropertyList } from '../src/utils/property.js';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');

assert.equal(normalizeSearch('  Đặng Văn Ngữ  '), 'dang van ngu');
assert.equal(matchesPrice({ purpose: 'rent', price_rent: 10e6 }, 'under-3b'), false);
assert.equal(matchesPrice({ purpose: 'sale', price_sale: 2e9 }, 'rent-under-15m'), false);
assert.equal(matchesPrice({ purpose: 'sale', price_sale: null }, 'under-3b'), false);
assert.equal(matchesPrice({ purpose: 'sale', price_sale: '3000000000' }, 'under-3b'), false);
assert.equal(matchesPrice({ purpose: 'sale', price_sale: '3000000000' }, '3b-6b'), true);
assert.equal(matchesPrice({ purpose: 'rent', price_rent: 15e6 }, 'rent-15m-30m'), true);
assert.equal(validCoordinates({ lat: 0, lng: '0' }), true);
for (const lat of [null, '', ' ', Infinity, 'bad', 91]) assert.equal(validCoordinates({ lat, lng: 106 }), false);
for (const value of ['null', '{}', 'broken', '[null, {}, {"code":"A"}]']) {
  globalThis.localStorage = { getItem: () => value };
  assert.deepEqual(readPropertyList('test'), value.startsWith('[') ? [{ code: 'A' }] : []);
}
globalThis.localStorage = { getItem() { throw new Error('blocked'); } };
assert.deepEqual(readPropertyList('test'), []);

function checkSyntax(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) checkSyntax(path);
    else if (/\.(jsx|js)$/.test(path)) parse(readFileSync(path, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  }
}
checkSyntax(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
console.log('PASS: property regression cases and syntax of all frontend source files');
