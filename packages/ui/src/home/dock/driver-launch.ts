import { NEW_TRIP_SECTION, type Location } from '@platform/contracts';
import { useState } from 'react';
import { tripToRepeat } from '../../driver-trips/trip-week';
import type { HomeGo, Launch } from '../../flow/start-action';
import type { PlaceDirectory } from '../../places/directory';
import { tomorrowTrip } from '../../trip-end/return-plan';
import { useDockEnds } from '../dock-ends';
import { useDriverData } from '../driver-data';

export const PASSENGER_REQUESTS = 'passenger_requests';

// What the block of a free driver opens (G76; G79 В4, В6а), the cards «Siz haydovchisiz!» and «Kam»
// too: the ends of the block, «Qayerga» of the last trip when none is chosen. On the route of the
// last trip a new trip takes its answers, tomorrow at its time, as «Ertaga shu safar» (G64); the
// requests come from «Qayerdan» of the block.
export function useDriverLaunch(go: HomeGo, directory: PlaceDirectory | null) {
  const trips = useDriverData().value?.[0] ?? [];
  const [now] = useState(Date.now);
  const last = tripToRepeat(trips, now);
  const again = last && directory ? tomorrowTrip(last, directory) : null;
  const ends = useDockEnds(directory, again?.route ?? null);
  const { from, to } = ends;
  const same = again && from?.id === again.route.from.id && to?.id === again.route.to.id;
  const publish = () => go(NEW_TRIP_SECTION, same ? again : tripEnds(from, to));
  const requests = () =>
    go(PASSENGER_REQUESTS, from ? { board: { from: from.id, ...(to ? { to: to.id } : {}) } } : undefined);
  return { ends, publish, requests };
}

export type DriverLaunch = ReturnType<typeof useDriverLaunch>;

// A new trip from the ends of the block: one end is kept, the other is asked first (G79 В4).
function tripEnds(from: Location | null, to: Location | null): Launch | undefined {
  if (from && to) return { route: { from, to } };
  if (from) return { from };
  return to ? { to } : undefined;
}
