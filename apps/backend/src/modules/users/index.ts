import { ME_PATH, type FaceDecision } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { checkAccess } from './application/check-access';
import { decideFace, pendingFaces } from './application/faces';
import { people } from './application/people';
import type { UsersDeps } from './application/ports';
import { accessGuard } from './http/access-guard';
import { faceRoutes } from './http/face-routes';
import { meRoutes, type Registered } from './http/me-routes';
import { userRoutes } from './http/user-routes';
import { d1FaceLog } from './infrastructure/d1-face-log';
import { d1Users } from './infrastructure/d1-users';
import { telegramFaces } from './infrastructure/telegram-faces';
import { notify } from '../notifications';
import { showQueue } from '../team-queue';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { r2Images } from '../../shared/storage/r2-images';
import { createMemoryUsers } from './infrastructure/memory-stores';
import { bookingStore, rideTogether } from '../bookings/infrastructure/store';
import { brandOf } from '../../shared/brand/brand-of';

// Without D1 and R2 (local runs, tests) the module keeps its data in memory.
export const localUsers = createMemoryUsers();
const localAvatars = createMemoryImages();

// Set by the app (module-events.ts): who of the team checks a new face, the channel invite.
type FaceTeam = (env: Bindings, userId: number) => Promise<number[]>;
let faceTeam: FaceTeam = async () => [];
export const wireFaceTeam = (next: FaceTeam) => void (faceTeam = next);
let registeredOf: (env: Bindings) => Registered = () => async () => undefined;
export const wireRegistered = (next: (env: Bindings) => Registered) => void (registeredOf = next);

const avatarsOf = (env: Bindings) => (env.MEDIA ? r2Images(env.MEDIA) : localAvatars);
const usersDeps = (env: Bindings): UsersDeps => ({
  users: env.DB ? d1Users(env.DB) : localUsers,
  avatars: avatarsOf(env),
  // Passengers with confirmed bookings on one trip see each other's photos (docs/05).
  trips: {
    relation: async (viewerId, ownerId) =>
      (await rideTogether(bookingStore(env), viewerId, ownerId)) ? 'co_passenger' : 'none',
  },
  // Local runs keep no journal of the face decisions.
  faceLog: env.DB ? d1FaceLog(env.DB) : { add: async () => undefined },
  faces: telegramFaces({
    fetch: (input, init) => fetch(input, init),
    brand: brandOf(env),
    adminToken: env.ADMIN_BOT_TOKEN,
    recipients: (userId) => faceTeam(env, userId),
    avatars: avatarsOf(env),
    send: (jobs) => notify(env, jobs),
    queue: (news) => showQueue(env, news),
  }),
  now: Date.now,
  newId: () => crypto.randomUUID(),
});

// The other modules forget a deleted person: set by the app (module-events.ts).
type ForgetOf = (env: Bindings, userId: number) => Promise<{ readonly holdPhone: boolean }>;
let forgetOf: ForgetOf = async () => ({ holdPhone: false });
export const wireAccountDeletion = (next: ForgetOf) => void (forgetOf = next);

// Routes need the Telegram session (shared/auth) set before them.
const guard = accessGuard(usersDeps);
export const usersModule = new Hono<AppEnv>()
  .use('/me/*', async (context, next) =>
    context.req.method === 'GET' && context.req.path === ME_PATH ? next() : guard(context, next),
  )
  .use('/users/*', guard)
  .route(
    '/',
    meRoutes({
      deps: usersDeps,
      forget: (env) => (userId) => forgetOf(env, userId),
      registered: (env) => registeredOf(env),
    }),
  )
  .route('/', userRoutes(usersDeps))
  .route('/', faceRoutes(usersDeps));

// For the bots: a blocked person gets "account blocked" in every bot too (docs/17).
export const isBlocked = async (env: Bindings, telegramId: number) =>
  (await checkAccess(usersDeps(env), telegramId)) !== null;
// The block in force, for «Odamlar» of the owner (G75): until when, or null for good.
export const blockOf = (env: Bindings, userId: number) => checkAccess(usersDeps(env), userId);

// Other modules reach people only through this (drivers, moderation).
export const peopleOf = (env: Bindings) => people(usersDeps(env));
export const blockedGuard = guard;
// Since when a person is with the brand: the card of a support question (G68).
export const joinedAtOf = async (env: Bindings, id: number) =>
  (await usersDeps(env).users.find(id))?.createdAt;
// The new face photos for «Navbat» of the team (G68): whose and since when.
export const waitingFaces = async (env: Bindings) =>
  (await pendingFaces(usersDeps(env))).map((face) => ({
    id: face.userId,
    name: face.firstName,
    since: face.uploadedAt,
  }));
export const decideFaceOf = (env: Bindings, moderatorId: number, userId: number, decision: FaceDecision) =>
  decideFace(usersDeps(env), moderatorId, userId, decision);
// The invite to the channel of the zone goes once per person (docs/119).
export const claimZoneInvite = (env: Bindings, userId: number) =>
  usersDeps(env).users.claimZoneInvite(userId, Date.now());
// The buttons of the face card in the admin bot (G51).
export {
  faceCardText,
  faceDecisionLine,
  faceMenu,
  faceReasonMenu,
  isFaceButton,
  parseFaceAction,
} from './infrastructure/face-card';
export type { Person } from './application/people';
