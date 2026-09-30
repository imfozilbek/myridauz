import {
  ADMIN_PITAK_DIRECTIONS_PATH,
  ADMIN_PITAK_HISTORY_PATH,
  ADMIN_PITAKS_PATH,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { allPitaks, pitakHistory, removeDirection, saveDirection, savePitak } from '../application/admin';
import type { PitaksDeps } from '../application/ports';

const STATUS = {
  'auth.not_admin': 403,
  'pitaks.not_found': 404,
  'pitaks.invalid_input': 400,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const NO_CONTENT = 204;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const teamOnly: MiddlewareHandler<AppEnv> = async (context, next) =>
  context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin');
const body = (context: Context<AppEnv>) => context.req.json().catch(() => null);

// The pitaks of the team (docs/72): every admin keeps the list, the history says who changed what.
export function pitakRoutes(deps: (env: Bindings) => PitaksDeps) {
  const one = `${ADMIN_PITAKS_PATH}/:id`;
  const direction = `${ADMIN_PITAK_DIRECTIONS_PATH}/:from/:to`;
  return new Hono<AppEnv>()
    .use(ADMIN_PITAKS_PATH, teamOnly)
    .use(one, teamOnly)
    .use(ADMIN_PITAK_HISTORY_PATH, teamOnly)
    .use(ADMIN_PITAK_DIRECTIONS_PATH, teamOnly)
    .use(direction, teamOnly)
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
    });
}
