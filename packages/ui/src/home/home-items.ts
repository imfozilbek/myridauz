import type { Booking, BookingStatus, Offer, RideRequest, Trip } from '@platform/contracts';
import type { TripAgain } from '../market/trip-draft';

// What the main screen shows (G25): the nearest live bookings and trips, at most two; all of them
// are in «Mening safarlarim» one row below. Closed, completed and cancelled ones never come here.
const SHOWN = 2;
const LIVE_BOOKINGS: readonly BookingStatus[] = ['requested', 'confirmed'];
const LIVE_TRIPS: readonly Trip['status'][] = ['active', 'full'];
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

export type DriverItem = { readonly trip: Trip; readonly requests: number };

// The new requests of a trip the driver has not answered yet: on the main screen and on the card in
// «Mening safarlarim» (G41, docs/90 F-D4).
export const waitingRequests = (trip: Trip, bookings: readonly Booking[]) =>
  bookings.filter((booking) => booking.trip.id === trip.id && booking.status === 'requested').length;

export function nextTrips(trips: readonly Trip[], bookings: readonly Booking[]): readonly DriverItem[] {
  const waiting = (trip: Trip) => waitingRequests(trip, bookings);
  const live = trips.filter((trip) => LIVE_TRIPS.includes(trip.status)).sort(byDeparture);
  return live.slice(0, SHOWN).map((trip) => ({ trip, requests: waiting(trip) }));
}

// «Oxirgi yoʻnalish»: the latest trip, to publish it again with only a new day (G40, docs/106 K3).
export function lastTrip(trips: readonly Trip[]): Trip | null {
  const [latest] = [...trips].sort((a, b) => b.departAt - a.departAt);
  return latest ?? null;
}

export const againOf = ({ pickupMode, seats, price, comment }: Trip): TripAgain => ({
  pickupMode,
  seats,
  price,
  comment,
});
