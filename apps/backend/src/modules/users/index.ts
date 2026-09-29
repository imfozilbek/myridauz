import { ME_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { checkAccess } from './application/check-access';
import { people } from './application/people';
import type { UsersDeps } from './application/ports';
import { accessGuard } from './http/access-guard';
import { meRoutes } from './http/me-routes';
import { userRoutes } from './http/user-routes';
import { d1Users } from './infrastructure/d1-users';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { r2Images } from '../../shared/storage/r2-images';
import { createMemoryUsers } from './infrastructure/memory-stores';
import { bookingStore, rideTogether } from '../bookings/infrastructure/store';

// Without D1 and R2 (local runs, tests) the module keeps its data in memory.
export const localUsers = createMemoryUsers();
const localAvatars = createMemoryImages();

const usersDeps = (env: Bindings): UsersDeps => ({
  users: env.DB ? d1Users(env.DB) : localUsers,
  avatars: env.MEDIA ? r2Images(env.MEDIA) : localAvatars,
  // Passengers with confirmed bookings on one trip see each other's photos (docs/05).
  trips: {
    relation: async (viewerId, ownerId) =>
      (await rideTogether(bookingStore(env), viewerId, ownerId)) ? 'co_passenger' : 'none',
  },
  now: Date.now,
  newId: () => crypto.randomUUID(),
});

const settings = (env: Bindings) => ({ passengerAvatarRequired: env.PASSENGER_AVATAR_REQUIRED === 'true' });

// Routes need the Telegram session (shared/auth) set before them.
const guard = accessGuard(usersDeps);
export const usersModule = new Hono<AppEnv>()
  .use('/me/*', async (context, next) =>
    context.req.method === 'GET' && context.req.path === ME_PATH ? next() : guard(context, next),
  )
  .use('/users/*', guard)
  .route('/', meRoutes({ deps: usersDeps, settings }))
  .route('/', userRoutes(usersDeps));

// For the bots: a blocked person gets "account blocked" in every bot too (docs/17).
export const isBlocked = async (env: Bindings, telegramId: number) =>
  (await checkAccess(usersDeps(env), telegramId)) !== null;

// Other modules reach people only through this (drivers, moderation).
export const peopleOf = (env: Bindings) => people(usersDeps(env));
export const blockedGuard = guard;
export type { Person } from './application/people';
