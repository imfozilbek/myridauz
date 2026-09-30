import {
  ADMIN_COMPLAINTS_PATH,
  blockSchema,
  COMPLAINTS_PATH,
  complaintDecisionSchema,
  complaintInputSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { fileComplaint } from '../application/file';
import { blockPerson } from '../application/block';
import { complaintChat, complaintQueue, decide, openComplaint } from '../application/moderate';
import type { ComplaintsDeps } from '../application/ports';

const STATUS = {
  'complaints.not_found': 404,
  'complaints.already': 409,
  'complaints.wrong_status': 409,
  'complaints.invalid_input': 400,
  'auth.not_admin': 403,
  'auth.not_owner': 403,
  'drivers.invalid_input': 400,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });

const moderatorOf = (context: Context<AppEnv>) => {
  const session = context.get('session');
  return { id: session.user.id, owner: session.teamRole === 'owner' };
};

// A complaint of a person and the work of the team on it (docs/17).
export const complaintRoutes = (deps: (env: Bindings) => ComplaintsDeps) =>
  new Hono<AppEnv>()
    .post(COMPLAINTS_PATH, async (context) => {
      const input = complaintInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('complaints.invalid_input');
      const result = await fileComplaint(deps(context.env), context.get('session').user.id, input.data);
      return typeof result === 'string' ? fail(result) : context.json(result, 201);
    })
    .use(`${ADMIN_COMPLAINTS_PATH}/*`, async (context, next) =>
      context.get('session').isAdmin ? next() : fail('auth.not_admin'),
    )
    .use(ADMIN_COMPLAINTS_PATH, async (context, next) =>
      context.get('session').isAdmin ? next() : fail('auth.not_admin'),
    )
    .get(ADMIN_COMPLAINTS_PATH, async (context) =>
      context.json({ complaints: await complaintQueue(deps(context.env)) }),
    )
    .get(`${ADMIN_COMPLAINTS_PATH}/:id`, async (context) => {
      const complaint = await openComplaint(deps(context.env), context.req.param('id'));
      return complaint ? context.json(complaint) : fail('complaints.not_found');
    })
    // A POST: every read of a chat is written to the log (docs/07).
    .post(`${ADMIN_COMPLAINTS_PATH}/:id/chat`, async (context) => {
      const moderatorId = context.get('session').user.id;
      const lines = await complaintChat(deps(context.env), moderatorId, context.req.param('id'));
      return lines ? context.json({ lines }) : fail('complaints.not_found');
    })
    .post(`${ADMIN_COMPLAINTS_PATH}/:id/decision`, async (context) => {
      const input = complaintDecisionSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('complaints.invalid_input');
      const result = await decide(
        deps(context.env),
        moderatorOf(context),
        context.req.param('id'),
        input.data,
      );
      return result === 'ok' ? context.body(null, 204) : fail(result);
    })
    // A block from the admin app goes the same way as one from a complaint (docs/65 A5).
    .use('/admin/users/*', async (context, next) =>
      context.get('session').isAdmin ? next() : fail('auth.not_admin'),
    )
    .post('/admin/users/:id{[0-9]+}/block', async (context) => {
      const input = blockSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('drivers.invalid_input');
      const { id, owner } = moderatorOf(context);
      const userId = Number(context.req.param('id'));
      const order = {
        userId,
        days: input.data.days,
        by: id,
        byOwner: owner,
        reason: 'admin',
        side: 'driver' as const,
      };
      const result = await blockPerson(deps(context.env), order);
      return result === 'ok' ? context.body(null, 204) : fail(result);
    });
