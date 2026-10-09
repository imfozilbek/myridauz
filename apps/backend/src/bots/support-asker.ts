import type { Booking, Rating, Trip } from '@platform/contracts';
import type { Bindings } from '../env';
import { liveBookingFor, pastRidesOf } from '../modules/bookings';
import { approvedCar } from '../modules/drivers';
import { placesOf } from '../modules/locations';
import { ratingsOfPeople } from '../modules/ratings';
import { upcomingTripsOf } from '../modules/trips';
import { joinedAtOf, peopleOf } from '../modules/users';
import type { Places } from '../shared/places/end-names';

// Who wrote to the support bot, as the card of the question shows it (G68, mockup g68/4).
export type Asker = {
  readonly name: string;
  readonly role: 'passenger' | 'driver' | 'guest';
  // The live booking of a passenger or the next trip of a driver, with a button to open it.
  readonly booking?: Booking | undefined;
  readonly trip?: Trip | undefined;
  readonly joinedAt?: number | undefined;
  readonly rides?: number;
  readonly rating?: Rating | undefined;
  readonly places: Places;
};

// A person without an account is only a name from Telegram.
export async function askerOf(env: Bindings, chatId: number, telegramName: string): Promise<Asker> {
  const places = await placesOf(env);
  const person = await peopleOf(env).find(chatId);
  if (!person) return { name: telegramName, role: 'guest', places };
  const driver = (await approvedCar(env, chatId)) !== null;
  const side = driver ? 'driver' : 'passenger';
  const [joinedAt, rides, ratings, live] = await Promise.all([
    joinedAtOf(env, chatId),
    pastRidesOf(env, chatId, side),
    ratingsOfPeople(env, [chatId]),
    driver ? upcomingTripsOf(env, [chatId]) : liveBookingFor(env, chatId),
  ]);
  const facts = {
    name: person.firstName,
    joinedAt,
    rides: new Set(rides.map((ride) => ride.tripId)).size,
    rating: ratings.get(chatId),
    places,
  };
  return Array.isArray(live)
    ? { ...facts, role: 'driver', trip: live.sort((a, b) => a.departAt - b.departAt)[0] }
    : { ...facts, role: 'passenger', booking: live };
}
