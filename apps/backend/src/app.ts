import { appHost, loadBrand } from '@platform/brands';
import { MINI_APPS } from '@platform/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setupRoutes } from './bots/setup-routes';
import { webhookRoutes } from './bots/webhook-routes';
import type { AppEnv } from './env';
import { analyticsModule } from './modules/analytics';
import { bookingsModule, tripCancelWatch } from './modules/bookings';
import { avatarWatch, driversModule } from './modules/drivers';
import { healthModule } from './modules/health';
import { locationsModule } from './modules/locations';
import { pricingModule } from './modules/pricing';
import { requestsModule } from './modules/ride-requests';
import { teamRole } from './modules/team';
import { tripsModule } from './modules/trips';
import { blockedGuard, usersModule } from './modules/users';
import { walletModule } from './modules/wallet';
import { telegramAuth } from './shared/auth/telegram-auth';

// Mini Apps live on their own subdomains, so the browser needs CORS to call the API.
const allowMiniApps = cors({
  origin: (origin, context) => {
    const brand = loadBrand((context.env as AppEnv['Bindings'] | undefined)?.BRAND);
    return MINI_APPS.some((app) => origin === `https://${appHost(brand, app)}`) ? origin : null;
  },
});
const auth = telegramAuth(Date.now, teamRole);

export const app = new Hono<AppEnv>()
  .use('/analytics', allowMiniApps)
  // CORS goes first: a browser preflight carries no Telegram signature.
  // "/me/*" also matches "/me".
  .use('/me/*', allowMiniApps, auth)
  .use('/users/*', allowMiniApps, auth)
  .use('/driver/*', allowMiniApps, auth, blockedGuard)
  .use('/admin/*', allowMiniApps, auth, blockedGuard)
  .use('/prices/*', allowMiniApps, auth, blockedGuard)
  .use('/passenger/*', allowMiniApps, auth, blockedGuard)
  .use('/trips', allowMiniApps, auth, blockedGuard)
  .use('/trips/*', allowMiniApps, auth, blockedGuard)
  // The directory is public: no personal data. Only a change of a distance checks the signature.
  .use('/locations', allowMiniApps)
  .use('/locations/*', allowMiniApps)
  .route('/', healthModule)
  .route('/', analyticsModule)
  // The avatar watch goes before users: it wraps the avatar route of the users module.
  .route('/', avatarWatch)
  .route('/', usersModule)
  .route('/', driversModule)
  .route('/', locationsModule(auth))
  .route('/', pricingModule)
  // The cancel watch goes before trips: it wraps the cancel route of the trips module.
  .route('/', tripCancelWatch)
  .route('/', tripsModule)
  .route('/', requestsModule)
  .route('/', bookingsModule)
  .route('/', walletModule)
  // Setup goes before the webhook route: "/telegram/:role" would take "/telegram/setup" as a bot name.
  .route(
    '/',
    setupRoutes((input, init) => fetch(input, init)),
  )
  .route(
    '/',
    webhookRoutes((input, init) => fetch(input, init)),
  );
