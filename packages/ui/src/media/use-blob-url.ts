import { useEffect, useState } from 'react';

// Avatars a person has seen stay in memory for the session: a row opened again shows the photo at
// once, not the gray icon first (G41, docs/108 D). Car photos are never kept: the team must always
// see the latest one. The oldest kept photo goes away when there are too many.
const KEPT_MAX = 60;
const kept = new Map<string, string>();

function keep(key: string, url: string) {
  kept.set(key, url);
  const [oldest] = kept.keys();
  if (kept.size > KEPT_MAX && oldest !== undefined) {
    URL.revokeObjectURL(kept.get(oldest) ?? '');
    kept.delete(oldest);
  }
}

// Private photos need the Telegram signature, so they are fetched and shown from memory (docs/05).
// key: load again when it changes (a new photo); null: nothing to load.
export function useBlobUrl(load: (() => Promise<Blob>) | null, key: string, remember = false): string | null {
  const [url, setUrl] = useState<string | null>(() => (remember ? (kept.get(key) ?? null) : null));
  useEffect(() => {
    if (!load) return undefined;
    const known = remember ? kept.get(key) : undefined;
    if (known) {
      setUrl(known);
      return undefined;
    }
    let objectUrl: string | null = null;
    let active = true;
    load().then(
      (blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        if (remember) keep(key, objectUrl);
        setUrl(objectUrl);
      },
      () => setUrl(null),
    );
    return () => {
      active = false;
      if (objectUrl && !remember) URL.revokeObjectURL(objectUrl);
    };
    // The loader is a new function on every render: the key says when to load again.
  }, [key]);
  return load ? url : null;
}
