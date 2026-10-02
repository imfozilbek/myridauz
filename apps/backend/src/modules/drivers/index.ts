import { loadBrand } from '@platform/brands';
import { MY_AVATAR_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { r2Images } from '../../shared/storage/r2-images';
import { recordServerEvent } from '../analytics';
import { teamMembers } from '../team';
import { peopleOf } from '../users';
import { missedWelcome, welcomeBonus } from '../wallet';
import { avatarChanged } from './application/moderate';
import type { DriversDeps } from './application/ports';
import { emptyApplication } from './domain/application';
import { adminRoutes } from './http/admin-routes';
import { driverRoutes } from './http/driver-routes';
import { createMemoryApplications, createMemoryDecisions } from './infrastructure/memory-applications';
import { d1Decisions } from './infrastructure/d1-decisions';
import { signalledNotifier } from './infrastructure/signalled-notifier';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { d1Applications } from './infrastructure/d1-applications';

// Without D1 and R2 (tests) the module keeps its data in memory.
const localApplications = createMemoryApplications();
const localDecisions = createMemoryDecisions();
const localPhotos = createMemoryImages();
const NO_CONTENT = 204;

export const driversDeps = (env: Bindings): DriversDeps => {
  const people = peopleOf(env);
  const photos = env.MEDIA ? r2Images(env.MEDIA) : localPhotos;
  const teamIds = async () => (await teamMembers(env)).map((member) => member.id);
  return {
    applications: env.DB ? d1Applications(env.DB) : localApplications,
    decisions: env.DB ? d1Decisions(env.DB) : localDecisions,
    photos,
    people,
    notify: signalledNotifier(
      env,
      telegramNotifier({
        fetch: (input, init) => fetch(input, init),
        brand: loadBrand(env.BRAND),
        adminToken: env.ADMIN_BOT_TOKEN,
        driverToken: env.DRIVER_BOT_TOKEN,
        teamIds,
        photos,
        people,
      }),
      teamIds,
    ),
    driverApproved: async (userId) => {
      recordServerEvent(env, { name: 'driver_approved' });
      return welcomeBonus(env, userId);
    },
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
};

// Routes need the Telegram session (shared/auth) and the block check (users) before them.
export const driversModule = new Hono<AppEnv>()
  .route('/', driverRoutes(driversDeps))
  .route('/', adminRoutes(driversDeps));

// A new face of an approved driver goes back to the team (docs/05). Runs around the users route.
export const avatarWatch = new Hono<AppEnv>().use(MY_AVATAR_PATH, async (context, next) => {
  await next();
  if (context.req.method === 'PUT' && context.res.status === NO_CONTENT) {
    await avatarChanged(driversDeps(context.env), context.get('session').user.id);
  }
});

export {
  cardMenu,
  cardText,
  decisionLine,
  parseCardAction,
  plateCheckMenu,
  reasonMenu,
} from './infrastructure/moderation-card';
export { decideApplication } from './application/moderate';

// The Cron job: approved drivers without a wallet get bonus 1 (docs/12).
export const grantMissedBonuses = async (env: Bindings) =>
  missedWelcome(env, await driversDeps(env).applications.approved());

// The car of an approved driver, for trips (docs/04): null for everyone else.
export const approvedCar = async (env: Bindings, userId: number) => {
  const application = await driversDeps(env).applications.find(userId);
  return application?.status === 'approved' ? application.car : null;
};

// "Maʼlumotlarimni oʻchirish" (docs/30): the car photos and the plate go, the application starts over.
export const forgetDriver = async (env: Bindings, userId: number) => {
  const deps = driversDeps(env);
  const application = await deps.applications.find(userId);
  if (!application) return;
  for (const key of Object.values(application.photos)) if (key) await deps.photos.delete(key);
  await deps.applications.save(emptyApplication(userId, deps.now()));
};
