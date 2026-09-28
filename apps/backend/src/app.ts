import { appHost, loadBrand } from '@platform/brands';
import { MINI_APPS } from '@platform/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setupRoutes } from './bots/setup-routes';
import { webhookRoutes } from './bots/webhook-routes';
import type { AppEnv } from './env';
import { analyticsModule } from './modules/analytics';
import { healthModule } from './modules/health';

// Mini Apps live on their own subdomains, so the browser needs CORS to call the API.
const allowMiniApps = cors({
  origin: (origin, context) => {
    const brand = loadBrand((context.env as AppEnv['Bindings'] | undefined)?.BRAND);
    return MINI_APPS.some((app) => origin === `https://${appHost(brand, app)}`) ? origin : null;
  },
});

export const app = new Hono<AppEnv>()
  .use('/analytics', allowMiniApps)
  .route('/', healthModule)
  .route('/', analyticsModule)
  // Setup goes before the webhook route: "/telegram/:role" would take "/telegram/setup" as a bot name.
  .route(
    '/',
    setupRoutes((input, init) => fetch(input, init)),
  )
  .route('/', webhookRoutes);
