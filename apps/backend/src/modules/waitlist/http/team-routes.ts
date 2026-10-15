import {
  ADMIN_WAITLIST_PATH,
  ADMIN_WAITLIST_STATS_PATH,
  DAY_MS,
  regionSchema,
  statsQuerySchema,
  TASHKENT_CITY,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import { waitlistStats } from '../application/gold';
import { direction, openDirection, overview, type TeamDeps } from '../application/team';
import { withDeps } from './with-deps';

const BAD_REQUEST = 400;
const PERIOD_DAYS = { day: 1, week: 7 } as const;
const isDirection = (region: string) => regionSchema.safeParse(region).success && region !== TASHKENT_CITY;

// What the team sees of the list (docs/181, docs/183): «Kutayotganlar», a direction and its
// opening, the «gold» of the statistics. Opening a direction is the owner's: the bot writes to many.
export const teamRoutes = (deps: (env: Bindings) => TeamDeps | null) =>
  new Hono<AppEnv>()
    .use(ADMIN_WAITLIST_PATH, teamOnly)
    .use(`${ADMIN_WAITLIST_PATH}/*`, teamOnly)
    .use(ADMIN_WAITLIST_STATS_PATH, teamOnly)
    .use(`${ADMIN_WAITLIST_PATH}/:region/open`, ownerOnly)
    .get(
      ADMIN_WAITLIST_PATH,
      withDeps(deps, async (context, found) => context.json(await overview(found))),
    )
    .get(
      ADMIN_WAITLIST_STATS_PATH,
      withDeps(deps, async (context, found) => {
        const query = statsQuerySchema.safeParse({ period: context.req.query('period') });
        if (!query.success) return context.json({ error: 'stats.invalid_input' }, BAD_REQUEST);
        const { period } = query.data;
        const since = found.now() - PERIOD_DAYS[period] * DAY_MS;
        return context.json(
          await found.cached(`waitlist:${period}`, () => waitlistStats(found.reads, since)),
        );
      }),
    )
    .get(
      `${ADMIN_WAITLIST_PATH}/:region`,
      withDeps(deps, async (context, found) => {
        const region = context.req.param('region') ?? '';
        if (!isDirection(region)) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        return context.json(await direction(found, region));
      }),
    )
    .post(
      `${ADMIN_WAITLIST_PATH}/:region/open`,
      withDeps(deps, async (context, found) => {
        const region = context.req.param('region') ?? '';
        if (!isDirection(region)) return context.json({ error: 'waitlist.invalid_input' }, BAD_REQUEST);
        return context.json(await openDirection(found, region, context.get('session').user.id));
      }),
    );
