import type { Trip } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { usePlaces } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { regionOf } from '../way/way-end';

// The requests of passengers for the way back on that day, region to region (docs/40, mockup
// g63/4 screen 16): «Samarqand viloyati → Toshkent shahri: 4 ta soʻrov bor».
export function useReturnRequests(trip: Trip, day: string) {
  const { market } = useApiClients();
  const directory = usePlaces();
  const region = (id: string) => {
    const place = directory.find(id);
    return place ? directory.find(regionOf(place)) : undefined;
  };
  const from = region(trip.to);
  const to = region(trip.from);
  const { value } = useLoad(() =>
    from && to ? market.searchRequests({ from: from.id, to: to.id, date: day }) : Promise.resolve([]),
  );
  return { count: value?.length ?? 0, from: from?.name ?? '', to: to?.name ?? '' };
}
