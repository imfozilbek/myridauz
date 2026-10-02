import { useCallback, useEffect, useState } from 'react';
import { useFeedChange } from '../feed/feed-context';
import { keepValue, keptValue } from '../screen/list-memory';

type LoadState<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly reload: () => void;
  readonly refresh: () => Promise<void>;
};

// Data from the API: null while loading, failed on an error, reload after a change.
// Another person's change, coming back to the app or a pull down refreshes it quietly: the old data
// stays on the screen until the fresh data comes, a failed refresh keeps it (docs/64, G19, docs/94).
// memory: the list comes back with its data after «Назад», without a skeleton (docs/94 F2).
export function useLoad<T>(load: () => Promise<T>, memory?: string): LoadState<T> {
  const [value, setValue] = useState<T | null>(() => (memory ? (keptValue<T>(memory) ?? null) : null));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (memory && value !== null) keepValue(memory, value);
  }, [memory, value]);
  const refresh = useCallback(
    () =>
      load().then(
        (fresh) => {
          setValue(fresh);
          setFailed(false);
        },
        () => undefined,
      ),
    // The loader is a new function on every render: the same loader as on mount.
    [],
  );
  // After a change the list stays on the screen until the fresh one comes (docs/94 F2).
  const reload = useCallback(() => {
    setFailed(false);
    load().then(setValue, () => setFailed(true));
  }, []);
  useEffect(() => {
    if (value === null) reload();
    else void refresh();
    // Once, when the screen opens.
  }, []);
  useFeedChange(() => void refresh());
  return { value, failed, reload, refresh };
}

export function useList<T>(load: () => Promise<T[]>, memory?: string) {
  const { value, failed, reload, refresh } = useLoad(load, memory);
  return { items: value, failed, reload, refresh };
}
