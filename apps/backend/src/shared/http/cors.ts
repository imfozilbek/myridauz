import { appHost, loadBrand } from '@platform/brands';
import { MINI_APPS } from '@platform/contracts';
import { cors } from 'hono/cors';
import type { AppEnv } from '../../env';

// Mini Apps live on their own subdomains, so the browser needs CORS to call the API.
const miniAppOrigin = (origin: string, context: { env: unknown }) => {
  const brand = loadBrand((context.env as AppEnv['Bindings'] | undefined)?.BRAND);
  return MINI_APPS.some((app) => origin === `https://${appHost(brand, app)}`) ? origin : null;
};
// The browser keeps the answer to a preflight this long (Chrome keeps 2 hours at most): without it
// every call of a Mini App is two requests to the Worker (G56, docs/117).
const PREFLIGHT_SECONDS = 7200;
export const allowMiniApps = cors({ origin: miniAppOrigin, maxAge: PREFLIGHT_SECONDS });
// The map library reads the parts of the archive: it needs to see where a part lies (G22).
export const allowMap = cors({
  origin: miniAppOrigin,
  exposeHeaders: ['content-range', 'etag'],
  maxAge: PREFLIGHT_SECONDS,
});
// The landing on the brand domain reads public prices (docs/59); the landing and the Mini Apps read
// the requisites of the legal documents (G34).
export const allowPublic = cors({
  maxAge: PREFLIGHT_SECONDS,
  origin: (origin, context) => {
    const { domain } = loadBrand((context.env as AppEnv['Bindings'] | undefined)?.BRAND);
    const site = [`https://${domain}`, `https://www.${domain}`].includes(origin);
    return site ? origin : miniAppOrigin(origin, context);
  },
});
