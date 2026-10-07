import type { TripDays } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import type { Route } from '../places/route-screen';
import { useLoad } from '../market/use-list';

// The trips of each day of a week on the route and its km (G59): one request for the chips.
export function useTripDays(route: Route) {
  const { market } = useApiClients();
  return useLoad<TripDays>(
    () => market.tripDays(route.from.id, route.to.id),
    `days:${route.from.id}:${route.to.id}`,
  );
}

// The search opens on the first day with trips; without any, on today (G35, docs/97 K2).
export const firstDay = (days: TripDays) => (days.days.find((day) => day.trips > 0) ?? days.days[0])?.date;
