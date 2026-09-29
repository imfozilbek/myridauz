import { useCallback, useEffect, useState } from 'react';

type ListState<T> = { readonly items: T[] | null; readonly failed: boolean; readonly reload: () => void };

// A list from the API: null while loading, failed on an error, reload after a change.
export function useList<T>(load: () => Promise<T[]>): ListState<T> {
  const [items, setItems] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);
  const reload = useCallback(() => {
    setFailed(false);
    setItems(null);
    load().then(setItems, () => setFailed(true));
    // The loader is a new function on every render: the list is loaded on mount and on reload only.
  }, []);
  useEffect(reload, [reload]);
  return { items, failed, reload };
}
