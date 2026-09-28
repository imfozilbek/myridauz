import { appHost, loadBrand } from '@platform/brands';
import { MINI_APPS } from '@platform/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setupRoutes } from './bots/setup-routes';
import { webhookRoutes } from './bots/webhook-routes';
import type { AppEnv } from './env';
import { analyticsModule } from './modules/analytics';
import { healthModule } from './modules/health';
import { locationsModule } from './modules/locations';
import { usersModule } from './modules/users';
import { telegramAuth } from './shared/auth/telegram-auth';

// Mini Apps live on their own subdomains, so the browser needs CORS to call the API.
const allowMiniApps = cors({
  origin: (origin, context) => {
    const brand = loadBrand((context.env as AppEnv['Bindings'] | undefined)?.BRAND);
    return MINI_APPS.some((app) => origin === `https://${appHost(brand, app)}`) ? origin : null;
  },
});
const auth = telegramAuth(Date.now);

export const app = new Hono<AppEnv>()
  .use('/analytics', allowMiniApps)
  // CORS goes first: a browser preflight carries no Telegram signature.
  // "/me/*" also matches "/me".
  .use('/me/*', allowMiniApps, auth)
  .use('/users/*', allowMiniApps, auth)
  // The directory is public: no personal data. Only a change of a distance checks the signature.
  .use('/locations', allowMiniApps)
  .use('/locations/*', allowMiniApps)
  .route('/', healthModule)
  .route('/', analyticsModule)
  .route('/', usersModule)
  .route('/', locationsModule(auth))
  // Setup goes before the webhook route: "/telegram/:role" would take "/telegram/setup" as a bot name.
  .route(
    '/',
    setupRoutes((input, init) => fetch(input, init)),
  )
  .route('/', webhookRoutes);
