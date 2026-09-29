import type { Bindings } from '../../env';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { TripsDeps } from './application/ports';
import { setMeetingPoint } from './application/meeting-point';
import { tripRoutes } from './http/trip-routes';
import { d1Trips } from './infrastructure/d1-trips';
import { createMemoryTrips } from './infrastructure/memory-trips';
import { telegramAnnouncer } from './infrastructure/telegram-announcer';

// Without D1 (tests) trips live in memory.
const localTrips = createMemoryTrips();

const tripsDeps = (env: Bindings): TripsDeps => ({
  trips: env.DB ? d1Trips(env.DB) : localTrips,
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  announce: telegramAnnouncer({
    fetch: (input, init) => fetch(input, init),
    driverToken: env.DRIVER_BOT_TOKEN,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
  }),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const tripsModule = tripRoutes(tripsDeps);

// The Cron job (docs/35): trips over by now become completed.
// A location the driver sent to the driver bot as an answer to a trip message (docs/14).
export const meetingPointFromBot = (
  env: Bindings,
  driverId: number,
  messageId: number,
  lat: number,
  lng: number,
) => setMeetingPoint(tripsDeps(env), driverId, messageId, { lat, lng });

export const completeTrips = (env: Bindings, now: number) => tripsDeps(env).trips.completeOver(now);
