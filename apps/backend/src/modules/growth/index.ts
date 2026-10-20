import {
  botStartLink,
  CARD_PICTURE_PATH,
  LOOP_CARD_PATH,
  loopVia,
  requestsBoardLink,
  requestsLinkValue,
  tripBookLink,
  MOMENT_CARD_PATH,
  MOMENT_OFFERED_PATH,
  MOMENT_PATH,
  MOMENT_STORY_PATH,
  QR_PICTURE_PATH,
  type GrowthLoop,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { rateLimit } from '../../shared/http/rate-limit';
import { storiesOf } from '../../shared/storage/stories';
import { prepareCard } from '../../shared/telegram/prepared-card';
import { placesOf } from '../locations';
import { bookingForShare, driverTripView } from '../bookings';
import { requestFacts } from '../ride-requests';
import { blockedGuard, peopleOf } from '../users';
import { growthRoutes, type Wiring } from './http/growth-routes';
import { cardMessage } from './infrastructure/card-text';
import { d1Growth } from './infrastructure/d1-growth';
import { loopMessage } from './infrastructure/loop-text';

const growthDeps = (env: Bindings): Wiring | null => {
  const db = env.DB;
  if (!db) return null;
  const brand = brandOf(env);
  return {
    store: d1Growth(db),
    passengerBot: brand.bots.passenger,
    now: Date.now,
    nameOf: async (userId) => (await peopleOf(env).find(userId))?.firstName,
    message: (input) => cardMessage(brand, input),
    prepare: (side, userId, message, link) =>
      prepareCard(
        (input, init) => fetch(input, init),
        side === 'passenger' ? env.PASSENGER_BOT_TOKEN : env.DRIVER_BOT_TOKEN,
        userId,
        message.text,
        link,
        message.words,
        message.photo,
      ),
    request: async (id) => {
      const request = await requestFacts(env, id);
      return request?.open ? request : undefined;
    },
    seat: async (id) => {
      const booking = await bookingForShare(env, id);
      if (!booking) return undefined;
      const { status, boardedAt, trip } = booking.view;
      // The car still takes people: confirmed, open for booking, not on the way (docs/123 loop 3).
      const takes =
        status === 'confirmed' && boardedAt === null && trip.status === 'active' && !trip.departedAt;
      return {
        ...trip,
        seatsLeft: takes ? trip.seatsLeft : 0,
        passengerId: booking.passengerId,
        tripId: trip.id,
      };
    },
    trip: async (id) => {
      const found = await driverTripView(env, id);
      if (!found) return undefined;
      const { trip, driverId } = found;
      // The car still takes people: open for booking, not on the way, not offered to one passenger
      // only (G64), G88 docs/193.
      const takes = trip.status === 'active' && !trip.departedAt && !trip.private;
      const { from, to, departAt, departUntil, price } = trip;
      const seatsLeft = takes ? trip.seatsLeft : 0;
      return { driverId, tripId: trip.id, from, to, departAt, departUntil, price, seatsLeft };
    },
    loopMessage: async (input) => loopMessage(brand, input, await placesOf(env)),
    links: {
      requests: (request, via) =>
        requestsBoardLink(brand.bots.driver, requestsLinkValue(request.from, request.to, request.date), via),
      trip: (tripId, via) => tripBookLink(brand.bots.passenger, tripId, via),
      start: (via) => botStartLink(brand.bots.passenger, via),
    },
    stories: storiesOf(env),
    newId: () => crypto.randomUUID(),
  };
};

// A blocked person shares nothing (docs/17); a card and a picture are actions with a limit (G42).
export const growthModule = new Hono<AppEnv>()
  .use(MOMENT_PATH, blockedGuard)
  .use(MOMENT_OFFERED_PATH, blockedGuard)
  .use(MOMENT_CARD_PATH, blockedGuard, rateLimit('ACTIONS_LIMIT', 'action'))
  .use(MOMENT_STORY_PATH, blockedGuard, rateLimit('ACTIONS_LIMIT', 'action'))
  .use(LOOP_CARD_PATH, blockedGuard, rateLimit('ACTIONS_LIMIT', 'action'))
  .use(QR_PICTURE_PATH, blockedGuard, rateLimit('ACTIONS_LIMIT', 'action'))
  .use(CARD_PICTURE_PATH, blockedGuard, rateLimit('ACTIONS_LIMIT', 'action'))
  .route('/', growthRoutes(growthDeps));

// The mark of a link a person shares outside the cards (docs/123): «Yaqinlarimga», the free seats,
// the request in a group, the QR on the glass. null: no D1 (local runs), the link goes without it.
export const personVia = async (env: Bindings, userId: number, loop: GrowthLoop) =>
  env.DB ? loopVia(loop, await d1Growth(env.DB).codeOf(userId)) : null;
