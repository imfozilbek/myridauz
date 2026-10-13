import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { fromSetup } from '../../../shared/telegram/webhook-secret';
import { keepLooks, uncheckedSince, type LooksDeps } from '../application/looks';

const UNAUTHORIZED = 401;
const BAD_REQUEST = 400;
// The calls of one round: under the 50 requests of a run of the free Workers (docs/117).
export const ROUND_BUDGET = 40;

// One round of the looks at once (docs/180): setup-bots calls it until every bot and channel is
// checked, so a new name reaches Telegram in a minute, not in a day. Protected like the setup.
export function looksRoutes(depsOf: (env: Bindings) => LooksDeps) {
  return new Hono<AppEnv>().post('/telegram/looks', async (context) => {
    if (!fromSetup(context.req, context.env.TELEGRAM_WEBHOOK_SECRET)) return context.body(null, UNAUTHORIZED);
    const since = Number(context.req.query('since'));
    if (!Number.isFinite(since)) return context.body(null, BAD_REQUEST);
    const deps = depsOf(context.env);
    const checked = await keepLooks(deps, ROUND_BUDGET);
    return context.json({ checked, left: await uncheckedSince(deps, since) });
  });
}
