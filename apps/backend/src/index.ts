import { app } from './app';
import type { Bindings } from './env';
import { expireRequests } from './modules/ride-requests';
import { completeTrips } from './modules/trips';

// Cloudflare Worker entry point: the API, and the Cron job that closes trips and requests
// whose time is over (docs/35, brands/<brand>/wrangler.toml).
export default {
  fetch: app.fetch,
  scheduled: async (_controller, env, context) => {
    const now = Date.now();
    context.waitUntil(Promise.all([completeTrips(env, now), expireRequests(env, now)]));
  },
} satisfies ExportedHandler<Bindings>;
