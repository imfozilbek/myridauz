import { ANALYTICS_PATH, analyticsBatchSchema } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { AnalyticsSink } from '../application/analytics-sink';
import { recordEvents } from '../application/record-events';

const NO_CONTENT = 204;
const BAD_REQUEST = 400;

export function analyticsRoutes(sinkFor: (env: Bindings) => AnalyticsSink, now: () => number) {
  return new Hono<AppEnv>().post(ANALYTICS_PATH, async (context) => {
    const parsed = analyticsBatchSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: 'analytics.invalid_batch' }, BAD_REQUEST);
    recordEvents(sinkFor(context.env ?? {}), parsed.data, now());
    return context.body(null, NO_CONTENT);
  });
}
