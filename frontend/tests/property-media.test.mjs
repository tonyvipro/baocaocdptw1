import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { resolvePropertyImage, propertyGallery } = await server.ssrLoadModule('/src/utils/propertyImage.js');
  const image = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
  assert.equal(resolvePropertyImage(image), '/property-images/photo-1545324418-cc1a3fa10c00.jpg');
  assert.equal(resolvePropertyImage(null), '');
  assert.equal(resolvePropertyImage('javascript:alert(1)'), '');
  assert.deepEqual(propertyGallery({ image, images: [{ image_url: image }] }), [resolvePropertyImage(image)]);
  assert.deepEqual(propertyGallery({ image: null }), []);
  assert.deepEqual(propertyGallery({ image: null, images: [null, image] }), [resolvePropertyImage(image)]);
  const { default: PropertyImage } = await server.ssrLoadModule('/src/components/properties/PropertyImage.jsx');
  const empty = renderToStaticMarkup(React.createElement(PropertyImage, { src: null, alt: 'BĐS', className: 'w-full h-full' }));
  assert.ok(!empty.includes('<img'));
  assert.match(empty, /role="img"/);
  const picture = renderToStaticMarkup(React.createElement(PropertyImage, { src: image, alt: 'BĐS' }));
  assert.match(picture, /src="\/property-images\//);
  const { readRecordLink } = await server.ssrLoadModule('/src/hooks/useRecordLink.js');
  const original = globalThis.window;
  try {
    globalThis.window = { location: { hash: '#admin/demands?record=7' } };
    assert.equal(readRecordLink('demands').id, 7);
    assert.equal(readRecordLink('users').id, undefined);
    window.location.hash = '#admin/demands?record=-1';
    assert.equal(readRecordLink('demands').id, null);
  } finally { if (original === undefined) delete globalThis.window; else globalThis.window = original; }
} finally { await server.close(); }
console.log('PASS: cached images, missing-photo state, real gallery deduplication and record navigation.');
