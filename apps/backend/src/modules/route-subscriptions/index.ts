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
    wantsNews: (id) => peopleOf(env).wantsNews(id),
  }),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const subscriptionsModule = subscriptionRoutes(subscriptionsDeps);

// A new trip: passengers subscribed to its route hear about it (docs/24).
// A view carries the public id: the owner's own route is skipped by the Telegram ID (docs/65 A3).
const ownerOf = async (env: Bindings, publicId: string) => (await peopleOf(env).idOf(publicId)) ?? 0;

export const tripPublished = async (env: Bindings, trip: Trip) =>
  matchNew(subscriptionsDeps(env), 'trips', {
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

// The Cron job: waiting matches together, renewal offers, dated subscriptions that are over.
export const sendWaitingSubscriptions = (env: Bindings) => sendWaiting(subscriptionsDeps(env));

// A deleted account (docs/30): its subscriptions go.
export const forgetSubscriptions = async (env: Bindings, userId: number) => {
  const { subscriptions } = subscriptionsDeps(env);
  for (const kind of SUBSCRIPTION_KINDS)
    for (const subscription of await subscriptions.byUser(userId, kind))
      await subscriptions.remove(subscription.id);
};
