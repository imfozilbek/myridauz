import {
  SUBSCRIPTION_KINDS,
  tashkentDate,
  tashkentTime,
  type RideRequest,
  type SubscriptionKind,
  type Trip,
} from '@platform/contracts';
import type { Bindings } from '../../env';
import { placeMatches } from '../../shared/places/place-match';
import { placesOf } from '../locations';
import { showNews } from '../notifications';
import { peopleOf } from '../users';
import { unsubscribe } from './application/manage';
import { endOverdue, matchCheaper, matchNew } from './application/notify';
import type { SubscriptionsDeps } from './application/ports';
import { subscriptionRoutes } from './http/subscription-routes';
import { botTeller } from './infrastructure/bot-teller';
import { createMemorySubscriptions, d1Subscriptions } from './infrastructure/subscription-store';
import { brandOf } from '../../shared/brand/brand-of';

const localSubscriptions = createMemorySubscriptions();

const subscriptionsDeps = (env: Bindings): SubscriptionsDeps => ({
  subscriptions: env.DB ? d1Subscriptions(env.DB) : localSubscriptions,
  placeMatches: async () => {
    const places = await placesOf(env);
    return (placeId, searchId) => placeMatches(placeId, searchId, places);
  },
  tell: botTeller({
    brand: brandOf(env),
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
    show: (news) => showNews(env, news),
    now: Date.now,
  }),
  limits: brandOf(env).subscriptions,
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
  name: trip.driver.firstName,
  time: tashkentTime(trip.departAt),
  seats: trip.seatsLeft,
  price: trip.price,
  wholeCar: false,
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
    name: request.passenger.firstName,
    time: null,
    seats: request.seats,
    price: request.price,
    wholeCar: request.wholeCar,
  });

// The routes a driver follows for requests (G64): the board of the driver shows their requests.
export const requestRoutesOf = async (env: Bindings, userId: number) =>
  (await subscriptionsDeps(env).subscriptions.byUser(userId, 'requests')).map(({ from, to }) => ({
    from,
    to,
  }));

// The Cron job: renewal offers, dated subscriptions that are over.
export const endSubscriptions = (env: Bindings) => endOverdue(subscriptionsDeps(env));

// «Bu yoʻnalish kerak emas» under the news card: only its owner ends it (docs/122 rule 4).
export const stopFromBot = (env: Bindings, userId: number, kind: SubscriptionKind, id: string) =>
  unsubscribe(subscriptionsDeps(env), userId, kind, id);
export { NEWS_OFF_PREFIX } from './infrastructure/bot-teller';

// A deleted account (docs/30): its subscriptions go.
export const forgetSubscriptions = async (env: Bindings, userId: number) => {
  const { subscriptions } = subscriptionsDeps(env);
  for (const kind of SUBSCRIPTION_KINDS)
    for (const subscription of await subscriptions.byUser(userId, kind))
      await subscriptions.remove(subscription.id);
};
