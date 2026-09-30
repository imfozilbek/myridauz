import type { BookingsDeps } from './ports';
import { chatKeyOf } from './rides';

// Every chat a person took part in: own bookings, bookings on own trips, offers both ways (docs/07).
// "Maʼlumotlarimni oʻchirish" deletes them (docs/30).
export async function chatKeysOf(deps: BookingsDeps, userId: number): Promise<string[]> {
  const [own, tripIds, sent, requests] = await Promise.all([
    deps.bookings.byPassenger(userId),
    deps.trips.ofDriver(userId),
    deps.offers.byDriver(userId),
    deps.requests.ofPassenger(userId),
  ]);
  const [onTrips, received] = await Promise.all([
    deps.bookings.byTrips(tripIds),
    deps.offers.byRequests(requests.map((request) => request.id)),
  ]);
  const bookingKeys = [...own, ...onTrips].map(chatKeyOf);
  const offerKeys = [...sent, ...received].map((offer) => `o${offer.id}`);
  return [...new Set([...bookingKeys, ...offerKeys])];
}
