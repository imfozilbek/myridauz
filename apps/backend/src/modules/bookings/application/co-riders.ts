import type { CoRider } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps } from './ports';

// A seat that rides or rode: its passenger is a companion of the others (docs/05, docs/17).
const rode = (booking: BookingRecord) =>
  (booking.status === 'confirmed' || booking.status === 'completed') && booking.noShowAt === null;

// The other passengers of the trip of a seat, by their Telegram IDs (G46, docs/111 Q4): whom its
// passenger may complain about. null: not this passenger's seat.
export async function coRiderIds(deps: BookingsDeps, passengerId: number, bookingId: string) {
  const record = await deps.bookings.find(bookingId);
  if (record?.passengerId !== passengerId) return null;
  if (!rode(record)) return [];
  const others = (await deps.bookings.byTrips([record.tripId])).filter(
    (booking) => rode(booking) && booking.passengerId !== passengerId,
  );
  return [...new Set(others.map((booking) => booking.passengerId))];
}

// The companions as the passenger sees them (docs/05): faces only while the trip is ahead or on the
// way, never a phone.
export async function coRiders(
  deps: BookingsDeps,
  passengerId: number,
  bookingId: string,
): Promise<readonly CoRider[] | null> {
  const ids = await coRiderIds(deps, passengerId, bookingId);
  if (ids === null) return null;
  const live = (await deps.bookings.find(bookingId))?.status === 'confirmed';
  const people = await Promise.all(ids.map((id) => deps.people.find(id)));
  return people.flatMap((person) =>
    person
      ? [{ id: person.publicId, firstName: person.firstName, hasAvatar: live && person.avatarShown }]
      : [],
  );
}
