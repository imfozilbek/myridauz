import type { Bindings } from '../../env';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { TripsDeps } from './application/ports';
import { tripRoutes } from './http/trip-routes';
import { d1Trips } from './infrastructure/d1-trips';
import { createMemoryTrips } from './infrastructure/memory-trips';

// Without D1 (tests) trips live in memory.
const localTrips = createMemoryTrips();

const tripsDeps = (env: Bindings): TripsDeps => ({
  trips: env.DB ? d1Trips(env.DB) : localTrips,
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const tripsModule = tripRoutes(tripsDeps);

// The Cron job (docs/35): trips over by now become completed.
export const completeTrips = (env: Bindings, now: number) => tripsDeps(env).trips.completeOver(now);
