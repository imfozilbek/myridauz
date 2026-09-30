import { useCallback, useEffect, useState } from 'react';
import { useFeedChange } from '../feed/feed-context';

type LoadState<T> = { readonly value: T | null; readonly failed: boolean; readonly reload: () => void };

// Data from the API: null while loading, failed on an error, reload after a change.
// Another person's change or coming back to the app refreshes it quietly: the old data stays on
// the screen until the fresh data comes, a failed refresh keeps it (docs/64, G19).
export function useLoad<T>(load: () => Promise<T>): LoadState<T> {
  const [value, setValue] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const reload = useCallback(() => {
    setFailed(false);
    setValue(null);
    load().then(setValue, () => setFailed(true));
    // The loader is a new function on every render: the data is loaded on mount and on reload only.
  }, []);
  useEffect(reload, [reload]);
  const refresh = useCallback(() => {
    load().then(
      (fresh) => {
        setValue(fresh);
        setFailed(false);
      },
      () => undefined,
    );
    // The same loader as on mount.
  }, []);
  useFeedChange(refresh);
  return { value, failed, reload };
}

export function useList<T>(load: () => Promise<T[]>) {
  const { value, failed, reload } = useLoad(load);
  return { items: value, failed, reload };
}
