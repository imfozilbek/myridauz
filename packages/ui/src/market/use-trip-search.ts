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

export function useTripSearch(route: Route, date: string, woman: boolean) {
  const { market } = useApiClients();
  const { track } = useAnalytics();
  const search = useMemo(
    () => ({ from: route.from.id, to: route.to.id, date, ...(woman ? { woman: '1' as const } : {}) }),
    [route, date, woman],
  );
  const memory = `${RESULTS}:${search.from}:${search.to}:${date}:${woman ? 'woman' : 'all'}`;
  const [trips, setTrips] = useState<Trip[] | null>(() => keptValue<Trip[]>(memory) ?? null);
  const [failed, setFailed] = useState(false);
  // A late answer of the search before a filter change never replaces the current one.
  const current = useRef(memory);
  current.current = memory;
  const take = useCallback((key: string, found: Trip[]) => {
    keepValue(key, found);
    if (current.current === key) setTrips(found);
  }, []);
  const refresh = useCallback(
    () =>
      market.searchTrips(search).then(
        (found) => take(memory, found),
        () => undefined,
      ),
    [market, search, memory, take],
  );
  const load = useCallback(() => {
    setFailed(false);
    setTrips(null);
    market.searchTrips(search).then(
      (found) => {
        track({
          name: 'trip_search',
          screen: 'market.results',
          result: found.length > 0 ? 'found' : 'empty',
        });
        take(memory, found);
      },
      () => {
        if (current.current === memory) setFailed(true);
      },
    );
  }, [market, search, memory, take, track]);
  useEffect(() => {
    const kept = keptValue<Trip[]>(memory);
    if (!kept) return load();
    setTrips(kept);
    void refresh();
    // A new search only when the filter or the route changes, not on a new loader.
  }, [memory]);
  // Seats taken by others while the person looks: fresh results without the skeleton (docs/64).
  useFeedChange(() => void refresh());
  return { trips, failed, load, refresh };
}
