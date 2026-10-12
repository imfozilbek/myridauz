import { seatHolds } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps } from './ports';

// The seat a passenger holds now (owner decision 12.10.2026, docs/172): one at a time, so a second
// seat or a request waits until this one is over.
export async function heldSeat(
  deps: Pick<BookingsDeps, 'trips'>,
  mine: readonly BookingRecord[],
  now: number,
): Promise<BookingRecord | null> {
  const asked = mine.filter((booking) => booking.status === 'requested' || booking.status === 'confirmed');
  const trips = await Promise.all(asked.map((booking) => deps.trips.find(booking.tripId)));
  return (
    asked.find((booking, index) => {
      const trip = trips[index];
      return trip !== undefined && seatHolds(booking, trip.live && trip.arrivedAt === null, now);
    }) ?? null
  );
}
