import { useCallback, useEffect, useState } from 'react';
import { buildDirectory, useLocationsClient, type PlaceDirectory } from './directory';

type DirectoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly directory: PlaceDirectory };

// Loads the directory once; the client keeps it for the whole session.
export function useDirectory(): readonly [DirectoryState, () => void] {
  const client = useLocationsClient();
  const [state, setState] = useState<DirectoryState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    client.getLocations().then(
      (response) => active && setState({ status: 'ready', directory: buildDirectory(response.locations) }),
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
