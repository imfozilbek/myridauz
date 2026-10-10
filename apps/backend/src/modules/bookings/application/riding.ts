import { onTheWay } from '@platform/contracts';
import type { BookingsDeps, TripFacts } from './ports';

// On the road and not arrived yet: the trip a blocked person still finishes (owner decision 10.10.2026).
const onRoad = (trip: TripFacts | undefined, now: number) =>
  trip !== undefined && trip.live && trip.arrivedAt === null && onTheWay(trip, now);

// The person is in a trip on the way now: as its driver, or with a confirmed seat (docs/158 Ж).
export async function ridingNow(deps: BookingsDeps, userId: number): Promise<boolean> {
  const now = deps.now();
  for (const tripId of await deps.trips.ofDriver(userId))
    if (onRoad(await deps.trips.find(tripId), now)) return true;
  for (const booking of await deps.bookings.byPassenger(userId))
    if (booking.status === 'confirmed' && onRoad(await deps.trips.find(booking.tripId), now)) return true;
  return false;
}
