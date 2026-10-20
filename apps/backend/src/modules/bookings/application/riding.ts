import { onTheWay } from '@platform/contracts';
import { chatBookingRecord } from './chat-member';
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

// The chat of the trip on the way: the only chat a person blocked on the road still writes to
// (owner decision 10.10.2026, G89 C3); the chats of other trips and requests are closed.
export async function ridingChat(deps: BookingsDeps, key: string, userId: number): Promise<boolean> {
  const booking = await chatBookingRecord(deps, key);
  if (booking?.status !== 'confirmed') return false;
  const trip = await deps.trips.find(booking.tripId);
  const side = booking.passengerId === userId || trip?.driverId === userId;
  return side && onRoad(trip, deps.now());
}
