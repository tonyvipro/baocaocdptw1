export const foldSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function nextSuggestionIndex(current, count, direction) {
  if (!count) return -1;
  if (current < 0) return direction > 0 ? 0 : count - 1;
  return (current + direction + count) % count;
}

export function prefixScore(value, query) {
  const text = foldSearch(value), term = foldSearch(query);
  if (!term) return 3;
  if (text.startsWith(term)) return 0;
  if (text.split(/\s+/).some((_, index, words) => words.slice(index).join(' ').startsWith(term))) return 1;
  return text.includes(term) ? 2 : 3;
}

export function projectSuggestions(projects, query) {
  return [...new Set(projects)].filter(project => prefixScore(project, query) < 3 || !foldSearch(query))
    .map((project, index) => ({ id: `project-${project}`, kind: 'project', label: project, value: project, score: prefixScore(project, query), index }))
    .sort((a, b) => a.score - b.score || a.index - b.index).slice(0, 8);
}

export function propertySuggestions(properties, ids, query) {
  if (!foldSearch(query)) return [];
  const byId = new Map(properties.map(property => [String(property.id), property]));
  const matches = ids.map(id => byId.get(String(id))).filter(Boolean);
  const projects = projectSuggestions(matches.map(property => property.project).filter(Boolean), query).slice(0, 3);
  const products = matches.map((property, index) => ({ id: `property-${property.id}`, kind: 'property', label: property.title,
    subtitle: property.project || property.address || property.code, property,
    score: prefixScore(property.title, query) < 3 ? prefixScore(property.title, query) : prefixScore(property.code, query) < 2 ? 2.5 : 3, index }))
    .sort((a, b) => a.score - b.score || a.index - b.index).slice(0, 5);
  return [...projects, ...products];
}
