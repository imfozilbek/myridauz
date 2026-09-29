import { app } from './app';
import type { Bindings } from './env';
import { expireBookings } from './modules/bookings';
import { grantMissedBonuses } from './modules/drivers';
import { expireRequests } from './modules/ride-requests';
import { completeTrips } from './modules/trips';
import { burnBonuses } from './modules/wallet';

// Cloudflare Worker entry point: the API, and the Cron job that closes trips, requests and bookings
// whose time is over, burns bonuses that are over and gives bonus 1 to approved drivers without it (docs/12, docs/35, brands/<brand>/wrangler.toml).
export default {
  fetch: app.fetch,
  scheduled: async (_controller, env, context) => {
    const now = Date.now();
    context.waitUntil(
      Promise.all([
        completeTrips(env, now),
        expireRequests(env, now),
        expireBookings(env, now),
        burnBonuses(env),
        grantMissedBonuses(env),
      ]),
    );
  },
} satisfies ExportedHandler<Bindings>;
