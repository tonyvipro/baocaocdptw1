import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.env.API_BASE_URL || 'http://localhost:8080';
const response = await fetch(base + '/api/properties', { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error('Could not read property images from the API.');
const rows = await response.json();
const photos = new Set(rows.flatMap(row => [row.image, ...(row.images || []).map(image => image.image_url || image.image)])
  .filter(Boolean).map(url => url.match(/images\.unsplash\.com\/(photo-[a-zA-Z0-9-]+)/)?.[1]).filter(Boolean));
// Photos used by the explicitly requested demo seeder.
for (const photo of ['photo-1545324418-cc1a3fa10c00', 'photo-1600585154340-be6161a56a0c', 'photo-1522708323590-d24dbb6b0267']) photos.add(photo);
const directory = fileURLToPath(new URL('../frontend/public/property-images/', import.meta.url));
mkdirSync(directory, { recursive: true });
const manifest = {};
for (const photo of photos) {
  try {
    const image = await fetch(`https://images.unsplash.com/${photo}?w=800&auto=format&fit=crop&q=80`, { signal: AbortSignal.timeout(20000) });
    if (image.status === 404) manifest[photo] = null;
    if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) throw new Error('HTTP ' + image.status);
    writeFileSync(directory + photo + '.jpg', Buffer.from(await image.arrayBuffer()));
    manifest[photo] = '/property-images/' + photo + '.jpg';
    console.log('Cached ' + photo);
  } catch (error) { console.log('Could not cache ' + photo + ': ' + error.message); }
}
writeFileSync(new URL('../frontend/src/data/property-image-cache.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Cached ${Object.values(manifest).filter(Boolean).length}/${photos.size} photos.`);
