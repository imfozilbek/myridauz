import type { BookingsDeps } from './ports';

// The talks of one pair about requests without a booking that make a sign (docs/129 rule 5).
const PAIR_TALKS = 3;

// A driver and a passenger that talked about requests 3 times and never booked: maybe a deal past
// Rida. The owner hears it in «Diqqat» (G75); a talk that became a booking does not count.
export async function watchPair(deps: BookingsDeps, driverId: number, passengerId: number): Promise<void> {
  const ids = (await deps.requests.ofPassenger(passengerId)).map((request) => request.id);
  const [talks, offers] = await Promise.all([deps.talks.byRequests(ids), deps.offers.byRequests(ids)]);
  const booked = new Set(
    offers.flatMap((offer) => (offer.bookingId !== null && offer.talkId ? [offer.talkId] : [])),
  );
  const unbooked = talks.filter((talk) => talk.driverId === driverId && !booked.has(talk.id)).length;
  if (unbooked >= PAIR_TALKS) await deps.pairTalked(driverId, passengerId, unbooked);
}
