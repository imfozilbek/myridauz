import { ADMIN_ROST_PATH, ADMIN_STATS_PATH, rostQuerySchema, statsQuerySchema } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { StatsDeps } from '../application/ports';
import { readRost } from '../application/read-rost';
import { readStats } from '../application/read-stats';

const FORBIDDEN = 403;
const BAD_REQUEST = 400;

// The dashboard of the team (docs/29): only the team, one period at a time.
export const statsRoutes = (deps: (env: Bindings) => StatsDeps) =>
  new Hono<AppEnv>()
    .get(ADMIN_STATS_PATH, async (context) => {
      if (!context.get('session').isAdmin) return context.json({ error: 'auth.not_admin' }, FORBIDDEN);
      const query = statsQuerySchema.safeParse({ period: context.req.query('period') });
      if (!query.success) return context.json({ error: 'stats.invalid_input' }, BAD_REQUEST);
      return context.json(await readStats(deps(context.env), query.data.period));
    })
    // «Rost» (G69, docs/123): what the loops of growth brought and the directions found.
    .get(ADMIN_ROST_PATH, async (context) => {
      if (!context.get('session').isAdmin) return context.json({ error: 'auth.not_admin' }, FORBIDDEN);
      const query = rostQuerySchema.safeParse({ period: context.req.query('period') });
      if (!query.success) return context.json({ error: 'stats.invalid_input' }, BAD_REQUEST);
      return context.json(await readRost(deps(context.env), query.data.period));
    });
