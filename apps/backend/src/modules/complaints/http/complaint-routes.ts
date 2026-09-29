import {
  ADMIN_COMPLAINTS_PATH,
  COMPLAINTS_PATH,
  complaintDecisionSchema,
  complaintInputSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { fileComplaint } from '../application/file';
import { complaintChat, complaintQueue, decide, openComplaint } from '../application/moderate';
import type { ComplaintsDeps } from '../application/ports';

const STATUS = {
  'complaints.not_found': 404,
  'complaints.already': 409,
  'complaints.wrong_status': 409,
  'complaints.invalid_input': 400,
  'auth.not_admin': 403,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });

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
      const moderatorId = context.get('session').user.id;
      const result = await decide(deps(context.env), moderatorId, context.req.param('id'), input.data);
      return result === 'ok' ? context.body(null, 204) : fail(result);
    });
