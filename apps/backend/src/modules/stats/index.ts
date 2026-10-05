import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { localAnalyticsRows } from '../analytics';
import { notifyTeam } from '../notifications';
import { checkAlerts } from './application/check-alerts';
import type { EventSource, StatsDeps } from './application/ports';
import { statsRoutes } from './http/stats-routes';
import { analyticsSql } from './infrastructure/analytics-sql';
import { alertMessage } from './infrastructure/bot-alert';
import { createMemoryCache, d1Cache } from './infrastructure/d1-cache';
import { d1Numbers } from './infrastructure/d1-numbers';
import { memoryEvents } from './infrastructure/memory-events';

const localCache = createMemoryCache();
const DATASET = /^[a-z][a-z0-9_]{0,63}$/;
// Locally there is no database: the main numbers are zero, the events come from the memory sink.
const zeroNumbers = {
  newUsers: 0,
  trips: 0,
  activeTrips: 0,
  bookings: 0,
  driverApplications: 0,
  complaints: 0,
};

function eventsOf(env: Bindings): EventSource | null {
  const { ANALYTICS, ANALYTICS_API_TOKEN: token, CF_ACCOUNT_ID: accountId, ANALYTICS_DATASET: dataset } = env;
  if (!ANALYTICS) return memoryEvents(localAnalyticsRows, Date.now);
  if (!token || !accountId || !dataset || !DATASET.test(dataset)) return null;
  return analyticsSql({ accountId, token, dataset, fetch: (input, init) => fetch(input, init) });
}

const statsDeps = (env: Bindings): StatsDeps => {
  const brand = loadBrand(env.BRAND);
  return {
    events: eventsOf(env),
    numbers: env.DB ? d1Numbers(env.DB) : { numbers: async () => zeroNumbers, arrivals: async () => [] },
    cache: env.DB ? d1Cache(env.DB) : localCache,
    rules: brand.alerts,
    tellTeam: async (alert) => {
      const { text, markup } = alertMessage(brand, alert);
      await notifyTeam(env, text, markup);
    },
    now: Date.now,
  };
};

export const statsModule = statsRoutes(statsDeps);

// The Cron job: the signals of the dashboard, once an hour (src/cron.ts).
export const checkStatsAlerts = (env: Bindings) => checkAlerts(statsDeps(env));
