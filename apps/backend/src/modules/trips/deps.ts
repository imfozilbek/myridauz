import type { Bindings } from '../../env';
import { bookingStore } from '../bookings/infrastructure/store';
import { maskContacts } from '../chat';
import { approvedCar } from '../drivers';
import { sendSignals } from '../feed';
import { placesOf, roadKmBetween } from '../locations';
import { directionRecommendationFor, recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import { pitakOf } from '../pitaks';
import type { TripEvent, TripsDeps } from './application/ports';
import { d1Trips } from './infrastructure/d1-trips';
import { createMemoryTrips } from './infrastructure/memory-trips';
import { brandOf } from '../../shared/brand/brand-of';

// Without D1 (tests) trips live in memory.
const localTrips = createMemoryTrips();

// What follows a published or changed trip (channel posts, route subscriptions): set by the app,
// which knows every module (app.ts), so trips does not depend on them.
type ChangeHandler = (env: Bindings, tripId: string, event: TripEvent) => Promise<void>;
let onChange: ChangeHandler = async () => undefined;
export const handleTripChange = (handler: ChangeHandler) => void (onChange = handler);

// Ratings, complaints and the views of the trip page come from their modules, set by the app
// (module-events.ts), G11, G76.
type Standing = Pick<TripsDeps, 'ratings' | 'hidden' | 'viewsOf'>;
type StandingOf = (env: Bindings) => Standing;
let standingOf: StandingOf = () => ({
  ratings: async () => new Map(),
  hidden: async () => new Set(),
  viewsOf: async () => new Map(),
});
export const wireTripStanding = (next: StandingOf) => void (standingOf = next);

export const tripsDeps = (env: Bindings): TripsDeps => ({
  trips: env.DB ? d1Trips(env.DB) : localTrips,
  riders: async (tripIds) =>
    (await bookingStore(env).byTrips(tripIds)).filter((booking) => booking.status === 'confirmed'),
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  ...standingOf(env),
  recommend: (from, to) => recommendationFor(env, from, to),
  recommendDirection: (from, to) => directionRecommendationFor(env, from, to),
  roadKm: (from, to) => roadKmBetween(env, from, to),
  schedule: brandOf(env).schedule,
  places: () => placesOf(env),
  pitakOf: (from, to) => pitakOf(env, from, to),
  changed: (tripId, event) => onChange(env, tripId, event),
  signal: (people) => sendSignals(env, people),
  mask: (text) => maskContacts(text).text,
  newId: () => crypto.randomUUID(),
  now: Date.now,
});
