import { loadBrand } from '@platform/brands';
import {
  SUBSCRIPTION_KINDS,
  tashkentDate,
  tashkentTime,
  type RideRequest,
  type Trip,
} from '@platform/contracts';
import type { Bindings } from '../../env';
import { placeMatches } from '../../shared/places/place-match';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import { peopleOf } from '../users';
import { matchCheaper, matchNew, sendWaiting } from './application/notify';
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
// A view carries the public id: the owner's own route is skipped by the Telegram ID (docs/65 A3).
const ownerOf = async (env: Bindings, publicId: string) => (await peopleOf(env).idOf(publicId)) ?? 0;

const tripMatch = async (env: Bindings, trip: Trip) => ({
  id: trip.id,
  ownerId: await ownerOf(env, trip.driver.id),
  from: trip.from,
  to: trip.to,
  date: tashkentDate(trip.departAt),
  woman: trip.woman,
  time: tashkentTime(trip.departAt),
  seats: trip.seatsLeft,
  price: trip.price,
});

export const tripPublished = async (env: Bindings, trip: Trip) =>
  matchNew(subscriptionsDeps(env), 'trips', await tripMatch(env, trip));

// A trip of the route became cheaper: its passengers hear it, once a day at most (G39, docs/104).
export const tripCheaper = async (env: Bindings, trip: Trip) =>
  matchCheaper(subscriptionsDeps(env), await tripMatch(env, trip));

// A new request: drivers subscribed to its route hear about it (docs/24).
export const requestPublished = async (env: Bindings, request: RideRequest) =>
  matchNew(subscriptionsDeps(env), 'requests', {
    id: request.id,
    ownerId: await ownerOf(env, request.passenger.id),
    from: request.from,
    to: request.to,
    date: request.date,
    woman: false,
    time: null,
    seats: request.seats,
    price: request.price,
  });

// The routes a driver follows for requests (G64): the board of the driver shows their requests.
export const requestRoutesOf = async (env: Bindings, userId: number) =>
  (await subscriptionsDeps(env).subscriptions.byUser(userId, 'requests')).map(({ from, to }) => ({
    from,
    to,
  }));

// The Cron job: waiting matches together, renewal offers, dated subscriptions that are over.
export const sendWaitingSubscriptions = (env: Bindings) => sendWaiting(subscriptionsDeps(env));

// A deleted account (docs/30): its subscriptions go.
export const forgetSubscriptions = async (env: Bindings, userId: number) => {
  const { subscriptions } = subscriptionsDeps(env);
  for (const kind of SUBSCRIPTION_KINDS)
    for (const subscription of await subscriptions.byUser(userId, kind))
      await subscriptions.remove(subscription.id);
};
