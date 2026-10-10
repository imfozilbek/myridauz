import type { Booking, Offer, RideRequest, Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { nextTrip, weekTrips } from './driver-day';
import { waitingOffers, waitingRequests } from './home-items';

// The live words under «Mening safarlarim» (G76, docs/165, mockups g76/2 and g76/3): short, the
// most alive thing first; the time of a seat or a trip is said by the caller with its own words.
export type TripsHint =
  | { readonly key: TranslationKey; readonly count: number }
  | { readonly at: number }
  | { readonly key: TranslationKey };

const LIVE_TRIPS: readonly Trip['status'][] = ['active', 'full'];

export function passengerTripsHint(
  bookings: readonly Booking[],
  requests: readonly RideRequest[],
  offers: readonly Offer[],
): TripsHint {
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const [only] = confirmed;
  if (confirmed.length > 1) return { key: 'home.tile.seats', count: confirmed.length };
  if (only) return { at: only.trip.departAt };
  const asked = bookings.filter((booking) => booking.status === 'requested').length;
  if (asked > 0) return { key: 'home.tile.asked', count: asked };
  const offered = waitingOffers(requests, offers).length;
  if (offered > 0) return { key: 'home.tile.offers', count: offered };
  const open = requests.filter((request) => request.status === 'open').length;
  if (open > 0) return { key: 'home.tile.requests', count: open };
  return pastOr(bookings.filter((booking) => booking.status === 'completed').length);
}

// The requests waiting first: they need the driver; then the nearest trip, then the week.
export function driverTripsHint(
  trips: readonly Trip[],
  bookings: readonly Booking[],
  now: number,
): TripsHint {
  const live = trips.filter((trip) => LIVE_TRIPS.includes(trip.status) && trip.departAt > now);
  const waiting = live.reduce((sum, trip) => sum + waitingRequests(trip, bookings), 0);
  if (waiting > 0) return { key: 'home.newRequests', count: waiting };
  const next = nextTrip(trips, now);
  if (next) return { at: next.departAt };
  if (trips.length === 0) return { key: 'home.tile.none' };
  return { key: 'home.driver.week', count: weekTrips(trips, now) };
}

const pastOr = (past: number): TripsHint =>
  past > 0 ? { key: 'home.tile.past', count: past } : { key: 'home.tile.none' };
