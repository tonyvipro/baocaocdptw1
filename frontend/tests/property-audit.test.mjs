import assert from 'node:assert/strict';
import { filterCatalog } from '../src/utils/propertyCatalog.js';

const listing = { code: 'AUDIT', title: 'Audit', status: 1, purpose: 'sale', price: 3e9, price_sale: 2e9, area: 80 };
assert.equal(filterCatalog([listing], { price: 'custom:1000000000-Infinity' }).length, 1, 'A minimum without maximum must work');
assert.equal(filterCatalog([listing], { area: 'custom-area:50-Infinity' }).length, 1, 'Area minimum without maximum must work');
assert.equal(filterCatalog([listing], { price: '3b-5b' }).length, 1, 'SQL price is the source of truth');
assert.equal(filterCatalog([{ ...listing, price: 0 }], { price: 'under-3b' }).length, 0, 'Zero is not a priced listing');
console.log('PASS: open ended ranges and canonical SQL price.');
