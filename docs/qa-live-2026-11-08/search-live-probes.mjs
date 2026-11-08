import { readFileSync, writeFileSync } from 'node:fs';

// All requests are anonymous GETs to this exact loopback origin. No --live
// application test scripts, authentication, external hosts, or write APIs.
const origin = 'http://127.0.0.1:8080';
const destination = new URL('./search-live-results.json', import.meta.url);
const startedAt = new Date().toISOString();
const results = [];

const publicFields = property => Object.fromEntries(
  ['id', 'code', 'title', 'project', 'status', 'expire_date', 'deleted_at']
    .filter(key => property?.[key] !== undefined)
    .map(key => [key, property[key]])
);

async function probe(name, path) {
  const url = new URL(path, origin);
  if (url.origin !== origin || !url.pathname.startsWith('/api/')) throw new Error('Loopback API GET only');
  const began = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET', headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    const raw = await response.text();
    let payload;
    try { payload = JSON.parse(raw); } catch { payload = null; }
    const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : null;
    const objectData = data?.filter(item => item && typeof item === 'object') || [];
    const row = {
      name, method: 'GET', path: url.pathname + url.search,
      status: response.status, elapsedMs: Date.now() - began,
      requestId: response.headers.get('x-request-id'),
      cacheControl: response.headers.get('cache-control'),
      contentType: response.headers.get('content-type'),
      shape: Array.isArray(payload) ? 'array' : payload && typeof payload === 'object' ? 'object' : 'non-json',
      count: data?.length ?? null,
      ids: data?.map(item => typeof item === 'number' ? item : item?.id) ?? null,
      meta: payload?.meta ?? null,
      message: payload?.message ?? null,
      errors: payload?.errors ?? null,
      sample: objectData.slice(0, 8).map(publicFields),
      invalidVisibility: objectData.filter(item => Number(item.status) !== 1 || item.deleted_at ||
        (item.expire_date && Number.isFinite(Date.parse(item.expire_date)) && Date.parse(item.expire_date) < began))
        .map(publicFields),
      nonJsonSample: payload === null ? raw.slice(0, 300) : undefined,
    };
    results.push(row);
    return { row, data };
  } catch (error) {
    const row = { name, method: 'GET', path: url.pathname + url.search,
      status: null, elapsedMs: Date.now() - began,
      error: { name: error.name, message: error.message, causeCode: error.cause?.code ?? null,
        causeMessage: error.cause?.message ?? null } };
    results.push(row);
    return { row, data: null };
  }
}

const smartPath = values => '/api/search/properties?' + new URLSearchParams(values);
const catalogPath = search => '/api/properties?' + new URLSearchParams({ search });
const save = summary => writeFileSync(destination, JSON.stringify({
  startedAt, finishedAt: new Date().toISOString(), origin,
  scope: 'Anonymous loopback HTTP GET only; 12 calls maximum; selected listing fields only; no credentials or app/data writes.',
  summary, results,
}, null, 2) + '\n', 'utf8');

if (process.argv.includes('--additional')) {
  const previous = JSON.parse(readFileSync(destination, 'utf8'));
  const baseline = previous.results.find(row => row.name === 'public-catalog-baseline');
  const selected = baseline.sample.find(item => /Căn hộ/iu.test(item.title || ''));
  if (!selected) throw new Error('No Căn hộ listing in saved public baseline sample');
  const publicIds = new Set(baseline.ids.map(String));
  const answers = await Promise.all([
    ['sql-vietnamese-accented', catalogPath('Căn hộ')],
    ['sql-vietnamese-accentless', catalogPath('Can ho')],
    ['guest-admin-literal-percent', '/api/properties?' + new URLSearchParams({ admin: '1', search: '%', per_page: '100' })],
  ].map(([name, path]) => probe(name, path)));
  for (const { row } of answers) {
    if (row.status === 200 && row.ids) row.idsMissingFromPublicBaseline = row.ids.filter(id => !publicIds.has(String(id)));
  }
  const [accented, accentless, adminPercent] = answers.map(answer => answer.row);
  const sortedIds = row => [...(row.ids || [])].map(String).sort();
  const accentChecks = {
    expectedKnownId: selected.id,
    accentedStatus200: accented.status === 200,
    accentlessStatus200: accentless.status === 200,
    sameMatchedIds: accented.status === 200 && accentless.status === 200 && JSON.stringify(sortedIds(accented)) === JSON.stringify(sortedIds(accentless)),
    knownIdInBoth: (accented.ids || []).some(id => String(id) === String(selected.id)) && (accentless.ids || []).some(id => String(id) === String(selected.id)),
    allIdsInPublicBaseline: answers.slice(0, 2).every(({ row }) => row.status === 200 && row.idsMissingFromPublicBaseline.length === 0),
    noNonPublicRecords: answers.slice(0, 2).every(({ row }) => row.status === 200 && row.invalidVisibility.length === 0),
  };
  const additional = {
    startedAt, finishedAt: new Date().toISOString(), calls: 3,
    accentChecks, accentChecksPassed: Object.entries(accentChecks).filter(([key]) => key !== 'expectedKnownId').every(([, value]) => value === true),
    functionalAccentComparisonPassed: accentChecks.accentedStatus200 && accentChecks.accentlessStatus200 && accentChecks.sameMatchedIds && accentChecks.knownIdInBoth && accentChecks.noNonPublicRecords,
    baselineComparisonInterpretation: accentChecks.allIdsInPublicBaseline
      ? 'Matched IDs remain within the initial baseline snapshot.'
      : 'Some IDs were absent from the earlier baseline; concurrent state changes must be resolved before classifying a visibility defect. Returned record visibility is checked independently.',
    guestAdminPercent: { status: adminPercent.status, count: adminPercent.count,
      ids: adminPercent.ids, missingPublicIds: adminPercent.idsMissingFromPublicBaseline,
      note: 'Percent is literal user input; existing titles can legitimately contain 100%. Admin envelope access as guest is an authorization finding independent of SQL wildcard escaping.' },
  };
  previous.results.push(...results);
  previous.summary.additional = additional;
  previous.finishedAt = additional.finishedAt;
  previous.scope = 'Anonymous loopback HTTP GET only; initial 12 calls plus 3 explicitly requested follow-up calls; selected listing fields only; no credentials or app/data writes.';
  writeFileSync(destination, JSON.stringify(previous, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(additional, null, 2));
  process.exit(0);
}

const baseline = await probe('public-catalog-baseline', '/api/properties');
if (baseline.row.status !== 200 || !Array.isArray(baseline.data)) {
  save({ outcome: 'blocked', reason: 'Public catalog baseline unavailable; dependent keyword probes not run.' });
  console.log(JSON.stringify({ baseline: baseline.row, resultFile: destination.pathname }, null, 2));
  process.exitCode = 1;
} else if (!baseline.data.length) {
  save({ outcome: 'blocked', reason: 'Public catalog empty; no real known listing keyword available.' });
  console.log('Public catalog is empty; saved report; no dependent probes run.');
  process.exitCode = 1;
} else {
  const selected = baseline.data.find(property => String(property.project || property.title || '').trim().split(/\s+/u).some(word => word.length >= 3));
  if (!selected) throw new Error('No suitable real catalog title/project keyword');
  const source = String(selected.project || selected.title).trim();
  const keyword = source.split(/\s+/u).find(word => word.length >= 3).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const uppercase = keyword.toLocaleUpperCase('vi');
  const accentless = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  const noMatch = 'QA_NO_MATCH_20261108_7f29c81e';
  const specs = [
    ['smart-known-normal', smartPath({ q: keyword, page: '1', per_page: '8' })],
    ['smart-known-catalog', smartPath({ q: keyword, catalog: '1' })],
    ['smart-whitespace', smartPath({ q: '   ' })],
    ['smart-no-match', smartPath({ q: noMatch })],
    ['smart-quote-sql-pattern', smartPath({ q: "' OR 1=1 --" })],
    ['smart-q-length-251', smartPath({ q: 'a'.repeat(251) })],
    ['smart-page0-per-page25', smartPath({ q: keyword, page: '0', per_page: '25' })],
    ['smart-q-array', smartPath({ 'q[]': keyword })],
    ['sql-uppercase-known', catalogPath(uppercase)],
    ['sql-accentless-known', catalogPath(accentless)],
    ['sql-no-match', catalogPath(noMatch)],
  ];
  const answers = await Promise.all(specs.map(([name, path]) => probe(name, path)));
  const byName = new Map(answers.map(answer => [answer.row.name, answer]));
  const publicIds = new Set(baseline.data.map(item => String(item.id)));
  for (const { row, data } of answers) {
    if (row.status !== 200 || !Array.isArray(data)) continue;
    row.idsMissingFromPublicBaseline = row.ids.filter(id => !publicIds.has(String(id)));
  }
  const normal = byName.get('smart-known-normal').row;
  const ranked = byName.get('smart-known-catalog').row;
  const rankedIds = new Set((ranked.ids || []).map(String));
  const providerAvailable = normal.status === 200 && ranked.status === 200;
  const summary = {
    baselineCount: baseline.data.length,
    selectedListing: publicFields(selected), keyword, uppercase, accentless,
    providerAvailable,
    providerEvidence: { normalStatus: normal.status, normalMessage: normal.message,
      catalogStatus: ranked.status, catalogMessage: ranked.message },
    normalIdsAllInCatalog: providerAvailable ? normal.ids.every(id => rankedIds.has(String(id))) : null,
    selectedIdInSmartCatalog: ranked.status === 200 ? rankedIds.has(String(selected.id)) : null,
    publicVisibilityIssues: results.flatMap(row => (row.invalidVisibility || []).map(record => ({ probe: row.name, record }))),
    missingBaselineIds: answers.flatMap(({ row }) => (row.idsMissingFromPublicBaseline || []).map(id => ({ probe: row.name, id }))),
    probes: answers.map(({ row }) => ({ name: row.name, status: row.status, count: row.count,
      unavailable: row.status === 503, networkError: row.error || null })),
    cautions: [
      '503 means provider unavailable; it is not a functional pass.',
      'Public IDs are a request-time SQL visibility snapshot; no hidden rows or DB were modified to seed tests.',
      'Smart search may use fuzzy matching; ID set equality with SQL substring search is not assumed.',
      'Page 0 and per_page 25 are combined in one request; inspect both validation error fields.',
    ],
  };
  save(summary);
  console.log(JSON.stringify(summary, null, 2));
}
