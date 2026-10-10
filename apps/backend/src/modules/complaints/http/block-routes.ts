import type { ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { blockJournal } from '../application/block-journal';
import type { ComplaintsDeps } from '../application/ports';
import { recordAction } from '../../journal';

const STATUS = {
  'auth.not_admin': 403,
  'auth.not_owner': 403,
  'users.not_found': 404,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });
const ONE = '/admin/users/:id{[0-9a-f]+}';

// The team reads the block journal of a person; only the owner lifts a block (docs/65 C).
export function blockRoutes(deps: (env: Bindings) => ComplaintsDeps) {
  const userOf = (context: Context<AppEnv>) => deps(context.env).people.idOf(context.req.param('id') ?? '');
  return new Hono<AppEnv>()
    .get(`${ONE}/blocks`, async (context) => {
      if (!context.get('session').isAdmin) return fail('auth.not_admin');
      const userId = await userOf(context);
      if (userId === undefined) return fail('users.not_found');
      return context.json(await blockJournal(deps(context.env), userId));
    })
    .post(`${ONE}/unblock`, async (context) => {
      const session = context.get('session');
      if (session.teamRole !== 'owner') return fail('auth.not_owner');
      const userId = await userOf(context);
      if (userId === undefined) return fail('users.not_found');
      await deps(context.env).people.unblock(userId, { by: session.user.id, reason: 'unblock' });
      const subject = context.req.param('id') ?? '';
      await recordAction(context.env, {
        memberId: session.user.id,
        kind: 'unblock',
        subject,
        action: 'unblock',
        since: null,
      });
      return context.body(null, 204);
    });
}
