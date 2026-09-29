import { loadBrand } from '@platform/brands';
import { tashkentDate, tashkentTime, type RideRequest, type Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placeMatches } from '../../shared/places/place-match';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { matchNew, sendWaiting } from './application/notify';
import type { SubscriptionsDeps } from './application/ports';
import { subscriptionRoutes } from './http/subscription-routes';
import { botTeller } from './infrastructure/bot-teller';
import { createMemorySubscriptions, d1Subscriptions } from './infrastructure/subscription-store';

const localSubscriptions = createMemorySubscriptions();

const subscriptionsDeps = (env: Bindings): SubscriptionsDeps => ({
  subscriptions: env.DB ? d1Subscriptions(env.DB) : localSubscriptions,
  placeMatches: async () => {
    const places = await placesOf(env);
    return (placeId, searchId) => placeMatches(placeId, searchId, places);
  },
  tell: botTeller({
    brand: loadBrand(env.BRAND),
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
    send: (jobs) => notify(env, jobs),
  }),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const subscriptionsModule = subscriptionRoutes(subscriptionsDeps);

// A new trip: passengers subscribed to its route hear about it (docs/24).
export const tripPublished = (env: Bindings, trip: Trip) =>
  matchNew(subscriptionsDeps(env), 'trips', {
    id: trip.id,
    ownerId: trip.driver.id,
    from: trip.from,
    to: trip.to,
    date: tashkentDate(trip.departAt),
    woman: trip.woman,
    time: tashkentTime(trip.departAt),
    seats: trip.seatsLeft,
    price: trip.price,
  });

// A new request: drivers subscribed to its route hear about it (docs/24).
export const requestPublished = (env: Bindings, request: RideRequest) =>
  matchNew(subscriptionsDeps(env), 'requests', {
    id: request.id,
    ownerId: request.passenger.id,
    from: request.from,
    to: request.to,
    date: request.date,
    woman: false,
    time: null,
    seats: request.seats,
    price: request.price,
  });

// The Cron job: waiting matches together, renewal offers, dated subscriptions that are over.
export const sendWaitingSubscriptions = (env: Bindings) => sendWaiting(subscriptionsDeps(env));
