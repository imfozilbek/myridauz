import { useEffect, useState } from 'react';

// Private photos need the Telegram signature, so they are fetched and shown from memory (docs/05).
// key: load again when it changes (a new photo); null: nothing to load.
export function useBlobUrl(load: (() => Promise<Blob>) | null, key: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!load) return undefined;
    let objectUrl: string | null = null;
    let active = true;
    load().then(
      (blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      },
      () => setUrl(null),
    );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // The loader is a new function on every render: the key says when to load again.
  }, [key]);
  return load ? url : null;
}
