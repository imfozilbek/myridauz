import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import type { Route } from '../places/route-screen';
import { keepFound } from './use-trip-search';
import { today, tomorrow } from './when';

// The search opens on the nearest day with trips (G35, docs/97 K2): today, else tomorrow; with
// none, today and its empty list. Both answers are kept, so the list shows them without a new load.
export function useFirstDay(route: Route, now: number, known?: string) {
  const { market } = useApiClients();
  const [date, setDate] = useState<string | null>(known ?? null);
  useEffect(() => {
    if (known) return undefined;
    let active = true;
    const first = today(now);
    const next = tomorrow(now);
    const look = (day: string) =>
      market.searchTrips({ from: route.from.id, to: route.to.id, date: day }).then((trips) => {
        keepFound(route, day, trips);
        return trips.length;
      });
    Promise.all([look(first), look(next)]).then(
      ([soon, later]) => active && setDate(soon === 0 && later > 0 ? next : first),
      () => active && setDate(first),
    );
    return () => void (active = false);
  }, [market, route, now, known]);
  return date;
}
