import { chatKeyOfTalk } from '@platform/contracts';
import { bookingChatKey, offerChatKey } from '../domain/talk';
import type { BookingsDeps } from './ports';

// Every chat a person took part in: own bookings, bookings on own trips, offers and talks both ways
// (docs/07, G64). "Maʼlumotlarimni oʻchirish" deletes them (docs/30).
export async function chatKeysOf(deps: BookingsDeps, userId: number): Promise<string[]> {
  const [own, tripIds, sent, talked, requests] = await Promise.all([
    deps.bookings.byPassenger(userId),
    deps.trips.ofDriver(userId),
    deps.offers.byDriver(userId),
    deps.talks.byDriver(userId),
    deps.requests.ofPassenger(userId),
  ]);
  const requestIds = requests.map((request) => request.id);
  const [onTrips, received, heard] = await Promise.all([
    deps.bookings.byTrips(tripIds),
    deps.offers.byRequests(requestIds),
    deps.talks.byRequests(requestIds),
  ]);
  const bookingKeys = [...own, ...onTrips].map(bookingChatKey);
  const offerKeys = [...sent, ...received].map(offerChatKey);
  const talkKeys = [...talked, ...heard].map((talk) => chatKeyOfTalk(talk.id));
  return [...new Set([...bookingKeys, ...offerKeys, ...talkKeys])];
}
