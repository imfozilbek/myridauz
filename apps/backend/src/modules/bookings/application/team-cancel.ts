import { meetingBegun } from './meeting';
import type { BookingsDeps } from './ports';
import { expireTripOffers } from './salon-trip';
import { endSeatsOfTrip } from './trip-ended';

export type TeamCancelError = 'trips.not_found' | 'trips.wrong_status';

// The team cancels one trip (Q5 of docs/111, G45): as when its driver does, the requests and seats
// are cancelled with the commissions back; the passengers hear the team did it, the driver reads the
// reason. Only before the way: after «Keldi» or «Yoʻlga chiqdim» the ride has begun (G63).
export async function cancelTripByTeam(
  deps: BookingsDeps,
  tripId: string,
  reason: string,
): Promise<{ readonly driverId: number } | TeamCancelError> {
  const trip = await deps.trips.find(tripId);
  if (!trip) return 'trips.not_found';
  const { driverId } = trip;
  if (await meetingBegun(deps, driverId, tripId)) return 'trips.wrong_status';
  if (!(await deps.trips.cancel(driverId, tripId))) return 'trips.wrong_status';
  await endSeatsOfTrip(deps, driverId, tripId, 'team');
  await expireTripOffers(deps, driverId, tripId);
  await deps.notify.teamCancelled(driverId, reason);
  return { driverId };
}
