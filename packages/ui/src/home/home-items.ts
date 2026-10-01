import type { Booking, BookingStatus, Trip } from '@platform/contracts';

// What the main screen shows (G25): the nearest live bookings and trips, at most two; all of them
// are in «Mening safarlarim» one row below. Closed, completed and cancelled ones never come here.
const SHOWN = 2;
const LIVE_BOOKINGS: readonly BookingStatus[] = ['requested', 'confirmed'];
const LIVE_TRIPS: readonly Trip['status'][] = ['active', 'full'];
const byDeparture = (a: Trip, b: Trip) => a.departAt - b.departAt;

export function nextBookings(bookings: readonly Booking[]): readonly Booking[] {
  return bookings
    .filter((booking) => LIVE_BOOKINGS.includes(booking.status))
    .sort((a, b) => byDeparture(a.trip, b.trip))
    .slice(0, SHOWN);
}

export type DriverItem = { readonly trip: Trip; readonly requests: number };

export function nextTrips(trips: readonly Trip[], bookings: readonly Booking[]): readonly DriverItem[] {
  const waiting = (trip: Trip) =>
    bookings.filter((booking) => booking.trip.id === trip.id && booking.status === 'requested').length;
  const live = trips.filter((trip) => LIVE_TRIPS.includes(trip.status)).sort(byDeparture);
  return live.slice(0, SHOWN).map((trip) => ({ trip, requests: waiting(trip) }));
}

// «Oxirgi yoʻnalish»: the route of the latest trip, to publish it again in one tap.
export function lastRoute(trips: readonly Trip[]): { from: string; to: string } | null {
  const [latest] = [...trips].sort((a, b) => b.departAt - a.departAt);
  return latest ? { from: latest.from, to: latest.to } : null;
}
