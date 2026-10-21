import assert from 'node:assert/strict';
const base = process.env.API_BASE_URL || 'http://127.0.0.1:8080';
async function get(path, status = 200) {
  const response = await fetch(base + path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(45000) });
  assert.equal(response.status, status, path);
  return response.json();
}
const rows = await get('/api/properties');
assert.ok(Array.isArray(rows));
for (const row of rows) {
  assert.equal(Number(row.status), 1);
  assert.ok(!row.deleted_at);
  assert.ok(!row.expire_date || Date.parse(row.expire_date) >= Date.now());
  assert.equal(Number(row[row.purpose === 'rent' ? 'price_rent' : 'price_sale']), Number(row.price));
}
await get('/api/properties?admin=1', 401);
await get('/api/properties?mine=true', 401);
await get('/api/properties?price_min=10&price_max=1', 422);
await get('/api/properties?search[]=bad', 422);
for (const sort of ['price-asc', 'price-desc', 'area-asc', 'area-desc']) {
  const result = await get('/api/properties?sort=' + sort);
  const field = sort.startsWith('price') ? 'price' : 'area';
  for (let i = 1; i < result.length; i++) {
    assert.ok(sort.endsWith('asc') ? Number(result[i - 1][field]) <= Number(result[i][field]) : Number(result[i - 1][field]) >= Number(result[i][field]), sort);
  }
}
if (rows.length) {
  const row = rows[0];
  const search = await get('/api/properties?search=' + encodeURIComponent(row.code));
  assert.ok(search.some(p => p.code === row.code));
  const matching = await get(`/api/properties?price_min=${row.price}&price_max=${row.price}&area_min=${row.area}&area_max=${row.area}`);
  assert.ok(matching.some(p => p.code === row.code));
  assert.ok(matching.every(p => Number(p.price) === Number(row.price) && Number(p.area) === Number(row.area)));
}
console.log(`PASS: live MySQL public catalog (${rows.length} rows), privacy, invalid input, canonical prices, search, numeric ranges and four sorts. Read-only HTTP calls only.`);
