import { useEffect, useRef } from 'react';

export function readRecordLink(module) {
  if (typeof window === 'undefined') return {};
  const [route, query = ''] = window.location.hash.split('?');
  if (route !== '#admin/' + module) return {};
  const params = new URLSearchParams(query);
  const id = Number(params.get('record'));
  return { id: Number.isSafeInteger(id) && id > 0 ? id : null, search: (params.get('search') || '').slice(0, 250), tab: params.get('tab') };
}

export default function useRecordLink(module, onNavigate) {
  const latest = useRef(onNavigate);
  latest.current = onNavigate;
  useEffect(() => {
    let controller;
    const navigate = () => {
      controller?.abort();
      const link = readRecordLink(module);
      if (!link.id && !link.tab) return;
      controller = new AbortController();
      latest.current({ ...link, signal: controller.signal });
    };
    navigate();
    window.addEventListener('hashchange', navigate);
    return () => { controller?.abort(); window.removeEventListener('hashchange', navigate); };
  }, [module]);
}
