import {
  ADMIN_PITAK_DIRECTIONS_PATH,
  ADMIN_PITAK_HISTORY_PATH,
  ADMIN_PITAKS_PATH,
  PITAK_OF_DIRECTION_PATH,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import { allPitaks, pitakHistory, removeDirection, saveDirection, savePitak } from '../application/admin';
import type { PitaksDeps } from '../application/ports';
import { pitakOfDirection } from '../application/pitaks';

const STATUS = {
  'pitaks.not_found': 404,
  'pitaks.invalid_input': 400,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const NO_CONTENT = 204;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const body = (context: Context<AppEnv>) => context.req.json().catch(() => null);

// The pitaks of the team (docs/72): every admin keeps the list, the history says who changed what.
export function pitakRoutes(deps: (env: Bindings) => PitaksDeps) {
  const one = `${ADMIN_PITAKS_PATH}/:id`;
  const direction = `${ADMIN_PITAK_DIRECTIONS_PATH}/:from/:to`;
  return (
    new Hono<AppEnv>()
      // The pitaks are the owner's, reading too: a moderator has no «Boshqaruv» (docs/120, G75).
      .use(ADMIN_PITAKS_PATH, teamOnly, ownerOnly)
      .use(one, teamOnly, ownerOnly)
      .use(ADMIN_PITAK_HISTORY_PATH, teamOnly, ownerOnly)
      .use(ADMIN_PITAK_DIRECTIONS_PATH, teamOnly, ownerOnly)
      .use(direction, teamOnly, ownerOnly)
      // Everyone: the pitak of a direction of regions, when people may see it (docs/71).
      .get(PITAK_OF_DIRECTION_PATH, async (context) => {
        const { from = '', to = '' } = context.req.query();
        return context.json({ pitak: await pitakOfDirection(deps(context.env), from, to) });
      })
      .get(ADMIN_PITAKS_PATH, async (context) => context.json(await allPitaks(deps(context.env))))
      .get(ADMIN_PITAK_HISTORY_PATH, async (context) =>
        context.json({ changes: await pitakHistory(deps(context.env)) }),
      )
      .post(ADMIN_PITAKS_PATH, async (context) => {
        const by = context.get('session').user.id;
        const result = await savePitak(deps(context.env), by, null, await body(context));
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .put(one, async (context) => {
        const by = context.get('session').user.id;
        const result = await savePitak(deps(context.env), by, context.req.param('id'), await body(context));
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .put(ADMIN_PITAK_DIRECTIONS_PATH, async (context) => {
        const by = context.get('session').user.id;
        const result = await saveDirection(deps(context.env), by, await body(context));
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .delete(direction, async (context) => {
        const { from, to } = context.req.param();
        const by = context.get('session').user.id;
        return (await removeDirection(deps(context.env), by, from, to))
          ? context.body(null, NO_CONTENT)
          : fail(context, 'pitaks.not_found');
      })
  );
}
