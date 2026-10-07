import { DAY_MS, POINTS_KEEP_DAYS } from '@platform/contracts';
import type { BookingsDeps } from './ports';

// Points live POINTS_KEEP_DAYS after the trip (docs/69). A booking with an open complaint keeps
// them until the decision of the moderator; only the district stays after.
const KEEP_MS = POINTS_KEEP_DAYS * DAY_MS;

export async function eraseOldPoints(deps: BookingsDeps, now: number, complained: ReadonlySet<string>) {
  const cutoff = now - KEEP_MS;
  // A trip ends after its booking was made: only bookings older than the cutoff can be due.
  const keeping = await deps.bookings.keepingPoints(cutoff);
  const tripIds = [...new Set(keeping.map((booking) => booking.tripId))];
  const trips = await Promise.all(tripIds.map((id) => deps.trips.find(id)));
  const ended = new Set(trips.filter((trip) => trip && trip.endsAt < cutoff).map((trip) => trip?.id));
  const due = keeping.filter((booking) => ended.has(booking.tripId) && !complained.has(booking.id));
  await deps.bookings.erasePoints(due.map((booking) => booking.id));
}
