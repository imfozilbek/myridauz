import { loadBrand } from '@platform/brands';
import { MY_AVATAR_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { r2Images } from '../../shared/storage/r2-images';
import { recordServerEvent } from '../analytics';
import { teamMembers } from '../team';
import { peopleOf } from '../users';
import { welcomeBonus } from '../wallet';
import { avatarChanged } from './application/moderate';
import type { DriversDeps } from './application/ports';
import { adminRoutes } from './http/admin-routes';
import { driverRoutes } from './http/driver-routes';
import { createMemoryApplications } from './infrastructure/memory-applications';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { d1Applications } from './infrastructure/d1-applications';

// Without D1 and R2 (tests) the module keeps its data in memory.
const localApplications = createMemoryApplications();
const localPhotos = createMemoryImages();
const NO_CONTENT = 204;

export const driversDeps = (env: Bindings): DriversDeps => {
  const people = peopleOf(env);
  const photos = env.MEDIA ? r2Images(env.MEDIA) : localPhotos;
  return {
    applications: env.DB ? d1Applications(env.DB) : localApplications,
    photos,
    people,
    notify: telegramNotifier({
      fetch: (input, init) => fetch(input, init),
      brand: loadBrand(env.BRAND),
      adminToken: env.ADMIN_BOT_TOKEN,
      driverToken: env.DRIVER_BOT_TOKEN,
      teamIds: async () => (await teamMembers(env)).map((member) => member.id),
      photos,
      people,
    }),
    driverApproved: async (userId) => {
      recordServerEvent(env, 'driver_approved');
      await welcomeBonus(env, userId);
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

// The car of an approved driver, for trips (docs/04): null for everyone else.
export const approvedCar = async (env: Bindings, userId: number) => {
  const application = await driversDeps(env).applications.find(userId);
  return application?.status === 'approved' ? application.car : null;
};
