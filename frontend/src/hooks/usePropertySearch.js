import { useCallback, useEffect, useState } from 'react';
import { searchProperties } from '../services/propertySearch';

export default function usePropertySearch(value) {
  const query = value.trim();
  const [state, setState] = useState({ query: '', ids: [], isLoading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(previous => previous + 1), []);

  useEffect(() => {
    if (!query) {
      setState({ query: '', ids: [], isLoading: false, error: '' });
      return;
    }
    const controller = new AbortController();
    let active = true;
    setState({ query, ids: [], isLoading: true, error: '' });
    const timer = setTimeout(async () => {
      try {
        const result = await searchProperties(query, { catalog: true, signal: controller.signal });
        if (active) setState({ query, ids: result.data, isLoading: false, error: '' });
      } catch (cause) {
        if (active && cause.name !== 'AbortError') {
          setState({ query, ids: [], isLoading: false, error: cause.message || 'Không kết nối được máy chủ tìm kiếm.' });
        }
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

  // Hide the previous response immediately, including the render before effect cleanup.
  const current = query && state.query === query ? state : { query, ids: [], isLoading: Boolean(query), error: '' };
  return { ...current, retry };
}
