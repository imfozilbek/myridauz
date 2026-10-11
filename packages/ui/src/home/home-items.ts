import type { Booking, BookingStatus, Offer, RideRequest, Trip } from '@platform/contracts';

// What the tiles of the main screen show (G25): the nearest live bookings, at most two; all of them
// are in «Mening safarlarim». Closed, completed and cancelled ones never come here.
const SHOWN = 2;
const LIVE_BOOKINGS: readonly BookingStatus[] = ['requested', 'confirmed'];
const byDeparture = (a: Trip, b: Trip) => a.departAt - b.departAt;

export function nextBookings(bookings: readonly Booking[], most = SHOWN): readonly Booking[] {
  return bookings
    .filter((booking) => LIVE_BOOKINGS.includes(booking.status))
    .sort((a, b) => byDeparture(a.trip, b.trip))
    .slice(0, most);
}

// The offers of drivers waiting for the answer of the passenger, on the requests still open (G53).
export function waitingOffers(requests: readonly RideRequest[], offers: readonly Offer[]): readonly Offer[] {
  const open = new Set(requests.filter((request) => request.status === 'open').map((request) => request.id));
  return offers.filter((offer) => offer.status === 'sent' && open.has(offer.requestId));
}

// A request the driver can still answer: its time to answer is not over (docs/35). The block, the
// wallet and the sheet count only these, so «Javob berish» never opens an empty sheet (G76).
export const answerable = (booking: Booking, now: number) =>
  booking.status === 'requested' && booking.expiresAt > now;

// The new requests of a trip the driver has not answered yet: on the main screen and on the card in
// «Mening safarlarim» (G41, docs/90 F-D4).
export const waitingRequests = (trip: Trip, bookings: readonly Booking[]) =>
  bookings.filter((booking) => booking.trip.id === trip.id && booking.status === 'requested').length;
