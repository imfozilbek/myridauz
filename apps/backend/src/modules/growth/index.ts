import { MOMENT_CARD_PATH, MOMENT_OFFERED_PATH, MOMENT_PATH, MOMENT_STORY_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { rateLimit } from '../../shared/http/rate-limit';
import { prepareCard } from '../../shared/telegram/prepared-card';
import { placesOf } from '../locations';
import { storiesOf } from '../shares';
import { blockedGuard, joinedAtOf, peopleOf } from '../users';
import { growthRoutes, type Wiring } from './http/growth-routes';
import { cardMessage } from './infrastructure/card-text';
import { d1Growth } from './infrastructure/d1-growth';
import { d1Rides } from './infrastructure/d1-rides';

const growthDeps = (env: Bindings): Wiring | null => {
  const db = env.DB;
  if (!db) return null;
  const brand = brandOf(env);
  return {
    store: d1Growth(db),
    rides: d1Rides(db),
    joinedAt: (userId) => joinedAtOf(env, userId),
    passengerBot: brand.bots.passenger,
    now: Date.now,
    nameOf: async (userId) => (await peopleOf(env).find(userId))?.firstName,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
    message: (input) => cardMessage(brand, input),
    prepare: (side, userId, message, link) =>
      prepareCard(
        (input, init) => fetch(input, init),
        side === 'passenger' ? env.PASSENGER_BOT_TOKEN : env.DRIVER_BOT_TOKEN,
        userId,
        message.text,
        link,
        message.words,
      ),
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
  .route('/', growthRoutes(growthDeps));
