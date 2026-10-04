import { useCallback, useEffect, useState } from 'react';
import { buildDirectory, useLocationsClient, type PlaceDirectory } from './directory';

type DirectoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly directory: PlaceDirectory };

// The directory built once per client: a screen opened after the first one has it at once, without
// a frame of skeleton (G41, docs/108 C).
const built = new WeakMap<object, PlaceDirectory>();

// Loads the directory once; the client keeps it for the whole session.
export function useDirectory(): readonly [DirectoryState, () => void] {
  const client = useLocationsClient();
  const [state, setState] = useState<DirectoryState>(() => {
    const directory = built.get(client);
    return directory ? { status: 'ready', directory } : { status: 'loading' };
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (built.has(client)) return;
    client.getLocations().then(
      (response) => {
        const directory = buildDirectory(response.locations);
        built.set(client, directory);
        if (active) setState({ status: 'ready', directory });
      },
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [client, attempt]);
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);
  return [state, retry] as const;
}
