import {
  ADMIN_PATHS_FILE_PATH,
  ADMIN_PATHS_PATH,
  ADMIN_ROST_PATH,
  ADMIN_STATS_PATH,
  rostQuerySchema,
  statsQuerySchema,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { StatsDeps } from '../application/ports';
import { readPaths } from '../application/read-paths';
import { sendPathsFile } from '../application/send-paths-file';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { readRost } from '../application/read-rost';
import { readStats } from '../application/read-stats';

const FORBIDDEN = 403;
const BAD_REQUEST = 400;
const NO_CONTENT = 204;

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
    })
    // G99 (docs/234): the paths by source, version of Telegram and platform.
    .get(ADMIN_PATHS_PATH, async (context) => {
      if (!context.get('session').isAdmin) return context.json({ error: 'auth.not_admin' }, FORBIDDEN);
      const query = statsQuerySchema.safeParse({ period: context.req.query('period') });
      if (!query.success) return context.json({ error: 'stats.invalid_input' }, BAD_REQUEST);
      return context.json(await readPaths(deps(context.env), query.data.period));
    })
    // G99 T6: the files for the analyst, only for the owner; the admin bot sends them.
    .post(ADMIN_PATHS_FILE_PATH, ownerOnly, async (context) => {
      const query = statsQuerySchema.safeParse({ period: context.req.query('period') });
      if (!query.success) return context.json({ error: 'stats.invalid_input' }, BAD_REQUEST);
      await sendPathsFile(deps(context.env), query.data.period, context.get('session').user.id);
      return context.body(null, NO_CONTENT);
    });
