import cache from '../data/property-image-cache.json';

export function resolvePropertyImage(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source || /^(?:javascript|vbscript|data):/i.test(source)) return '';
  const photo = source.match(/images\.unsplash\.com\/(photo-[a-zA-Z0-9-]+)/)?.[1];
  return Object.prototype.hasOwnProperty.call(cache, photo) ? (cache[photo] || '') : source;
}

export function propertyGallery(property) {
  return [...new Set([property.image, ...(Array.isArray(property.images) ? property.images.map(image => typeof image === 'string' ? image : image?.image_url || image?.image) : [])]
    .map(resolvePropertyImage).filter(Boolean))];
}
