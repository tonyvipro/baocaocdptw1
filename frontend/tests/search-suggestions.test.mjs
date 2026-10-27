import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { foldSearch, nextSuggestionIndex, prefixScore, projectSuggestions, propertySuggestions } from '../src/utils/searchSuggestions.js';

assert.equal(foldSearch('  Đất Nền Thảo Điền '), 'dat nen thao dien');
assert.equal(prefixScore('Duplex Thảo Điền', 'd'), 0);
assert.equal(prefixScore('Căn hộ Duplex', 'd'), 1);
assert.equal(prefixScore('Landmark', 'd'), 2);
assert.equal(prefixScore('Vinhomes', 'd'), 3);
assert.deepEqual(projectSuggestions(['Vinhomes', 'Diamond Island', 'Khu Đô Thị', 'Diamond Island'], 'd').map(item => item.label), ['Diamond Island', 'Khu Đô Thị']);
assert.equal(projectSuggestions(['Thảo Điền'], 'thao')[0].label, 'Thảo Điền');
assert.deepEqual(projectSuggestions(['Thảo Điền'], 'zzzz'), []);
const properties = [
  { id: 1, title: 'Landmark', project: 'Landmark 81' },
  { id: 2, title: 'Căn hộ Duplex', project: 'Vinhomes' },
  { id: 3, title: 'Đất nền', project: 'Diamond Island' },
  { id: 4, title: 'Duplex cao cấp', project: 'Diamond Island' },
  { id: 5, title: 'Căn hộ mẫu', code: 'DEMO-GIA-001', project: 'Vinhomes' },
];
const suggestions = propertySuggestions(properties, [1, 2, 3, 4, 5, 999], 'd');
assert.equal(suggestions[0].label, 'Diamond Island');
assert.deepEqual(suggestions.filter(item => item.kind === 'property').map(item => item.property.id), [3, 4, 2, 1, 5]);
assert.deepEqual(propertySuggestions(properties, [], 'd'), [], 'no stale/local fallback when the engine returned no public IDs');
assert.deepEqual(propertySuggestions(properties, [1, 2], ' '), []);
assert.deepEqual(propertySuggestions(properties, [4], 'd').filter(item => item.kind === 'property').map(item => item.property.id), [4]);
assert.equal(nextSuggestionIndex(-1, 4, 1), 0);
assert.equal(nextSuggestionIndex(-1, 4, -1), 3);
assert.equal(nextSuggestionIndex(3, 4, 1), 0);
assert.equal(nextSuggestionIndex(0, 4, -1), 3);
assert.equal(nextSuggestionIndex(0, 0, 1), -1);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { default: SearchCombobox } = await server.ssrLoadModule('/src/components/properties/SearchCombobox.jsx');
  const html = renderToStaticMarkup(React.createElement(SearchCombobox, { id: 'project-test', label: 'Dự án', value: 'd', onChange() {}, items: suggestions, onSelect() {}, loading: true }));
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-autocomplete="list"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /maxLength="250"/);
  const { default: ActivityLogDetails } = await server.ssrLoadModule('/src/components/ActivityLogDetails.jsx');
  const log = renderToStaticMarkup(React.createElement(ActivityLogDetails, { item: { subject: 'Danh mục #1', changes: [{ field: 'name', label: 'Tên', before: 'Căn hộ', after: 'Nhà phố' }] } }));
  assert.match(log, /Căn hộ/); assert.match(log, /Nhà phố/); assert.match(log, /<dt[^>]*>Tên<\/dt>/);
  assert.ok(!log.includes('undefined'));
} finally { await server.close(); }
console.log('PASS: prefix/word-prefix ranking, Vietnamese folding, public IDs, project deduplication, keyboard wrap, combobox accessibility and detailed audit rendering.');
