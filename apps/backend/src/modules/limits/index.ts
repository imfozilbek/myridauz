import { loadBrand } from '@platform/brands';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { recordAction } from '../journal';
import { peopleOf } from '../users';
import type { LimitStore } from './application/ports';
import { brandOf, keepLimits } from '../../shared/brand/brand-of';
import { createMemoryLimits, d1Limits } from './infrastructure/d1-limits';
import { limitRoutes } from './http/limit-routes';

// The limits the owner set (G75, docs/128 §4) are kept a short time in this isolate: every request
// and every Cron run refreshes them; a change here takes effect at once, elsewhere within half a minute.
const FRESH_MS = 30_000;
const memoryLimits = createMemoryLimits();
const storeOf = (env: Bindings): LimitStore => (env.DB ? d1Limits(env.DB) : memoryLimits);
let readAt = 0;

// D1 is down: the brand defaults stay in force, the step goes on.
export async function refreshLimits(env: Bindings): Promise<void> {
  if (Math.abs(Date.now() - readAt) < FRESH_MS) return;
  try {
    keepLimits(await storeOf(env).values());
    readAt = Date.now();
  } catch (error) {
    console.warn(JSON.stringify({ event: 'limits_failed', message: String(error) }));
  }
}

// The limits the owner set reach every rule of a request.
export const freshLimits: MiddlewareHandler<AppEnv> = async (context, next) => {
  await refreshLimits(context.env);
  await next();
};

export const limitsModule = limitRoutes({
  store: storeOf,
  brand: brandOf,
  base: (env) => loadBrand(env.BRAND),
  changed: async (env, key, by, values, after) => {
    keepLimits(values);
    readAt = Date.now();
    await recordAction(env, {
      memberId: by,
      kind: 'limits',
      subject: key,
      action: String(after),
      since: null,
    });
  },
  name: async (env, id) => (await peopleOf(env).find(id))?.firstName ?? '',
});
