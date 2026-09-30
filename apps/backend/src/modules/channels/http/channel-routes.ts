import { ADMIN_CHANNELS_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { allChannels, removeChannel, saveChannel, type TeamChannelsDeps } from '../application/team';

const STATUS = {
  'auth.not_admin': 403,
  'channels.not_found': 404,
  'channels.invalid_input': 400,
  'channels.bot_not_admin': 422,
  'locations.not_found': 404,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);

// The channels of the team (docs/63): only admins see and change them.
export function channelRoutes(deps: (env: Bindings) => Promise<TeamChannelsDeps>) {
  const one = `${ADMIN_CHANNELS_PATH}/:username`;
  return new Hono<AppEnv>()
    .use(ADMIN_CHANNELS_PATH, async (context, next) =>
      context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
    )
    .use(one, async (context, next) =>
      context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
    )
    .get(ADMIN_CHANNELS_PATH, async (context) =>
      context.json({ channels: await allChannels(await deps(context.env)) }),
    )
    .put(one, ownerOnly, async (context) => {
      const input = await context.req.json().catch(() => null);
      const result = await saveChannel(await deps(context.env), context.req.param('username'), input);
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .delete(one, ownerOnly, async (context) =>
      (await removeChannel(await deps(context.env), context.req.param('username')))
        ? context.body(null, 204)
        : fail(context, 'channels.not_found'),
    );
}
