import type { Trip } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';
import type { Route } from '../places/route-screen';
import { keepValue, keptValue } from '../screen/list-memory';

// The results of a search come back after a trip is opened and closed (docs/94 F2): the same trips
// at once, refreshed quietly; the search is counted once, not on every return.
export const RESULTS = 'market.results';
const keyOf = (from: string, to: string, date: string, woman: boolean) =>
  `${RESULTS}:${from}:${to}:${date}:${woman ? 'woman' : 'all'}`;
// Trips just found for the first day (G35, docs/97 K2): the list shows them without a new load.
const fresh = new Set<string>();

export function keepFound(route: Route, date: string, trips: Trip[]) {
  const key = keyOf(route.from.id, route.to.id, date, false);
  keepValue(key, trips);
  fresh.add(key);
}

export function useTripSearch(route: Route, date: string, woman: boolean) {
  const { market } = useApiClients();
  const { track } = useAnalytics();
  const search = useMemo(
    () => ({ from: route.from.id, to: route.to.id, date, ...(woman ? { woman: '1' as const } : {}) }),
    [route, date, woman],
  );
  const memory = keyOf(search.from, search.to, date, woman);
  const [found, setFound] = useState<{ readonly key: string; readonly trips: Trip[] } | null>(() => {
    const kept = keptValue<Trip[]>(memory);
    return kept ? { key: memory, trips: kept } : null;
  });
  const [failed, setFailed] = useState(false);
  // A late answer of the search before a filter change never replaces the current one.
  const current = useRef(memory);
  current.current = memory;
  const take = useCallback((key: string, found: Trip[]) => {
    keepValue(key, found);
    if (current.current === key) setFound({ key, trips: found });
  }, []);
  const refresh = useCallback(
    () =>
      market.searchTrips(search).then(
        (found) => take(memory, found),
        () => undefined,
      ),
    [market, search, memory, take],
  );
  const counted = useCallback(
    (found: Trip[]) =>
      track({ name: 'trip_search', screen: 'market.results', result: found.length > 0 ? 'found' : 'empty' }),
    [track],
  );
  const load = useCallback(() => {
    setFailed(false);
    market.searchTrips(search).then(
      (found) => {
        counted(found);
        take(memory, found);
      },
      () => {
        if (current.current === memory) setFailed(true);
      },
    );
  }, [market, search, memory, take, counted]);
  useEffect(() => {
    const kept = keptValue<Trip[]>(memory);
    if (!kept) return load();
    setFound({ key: memory, trips: kept });
    // Just found by the first day: counted here, once, and not asked again.
    if (fresh.delete(memory)) return counted(kept);
    void refresh();
    // A new search only when the filter or the route changes, not on a new loader.
  }, [memory]);
  // Seats taken by others while the person looks: fresh results without the skeleton (docs/64).
  useFeedChange(() => void refresh());
  // Another day or filter: the trips on the screen stay, dimmed, until the new ones come; the list
  // never collapses under the finger into a skeleton (G41, docs/108).
  return {
    trips: found?.trips ?? null,
    stale: found !== null && found.key !== memory,
    failed,
    load,
    refresh,
  };
}
