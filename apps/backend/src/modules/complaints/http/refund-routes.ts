import { ADMIN_COMPLAINTS_PATH, REFUND_ANSWERS, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { ComplaintsDeps } from '../application/ports';
import { answerRefund } from '../application/refund';
import { recordAction } from '../../journal';

const STATUS = {
  'complaints.not_found': 404,
  'complaints.wrong_status': 409,
  'auth.not_owner': 403,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

// Only the owner confirms or rejects the refund of a no-show (docs/35, G63).
export const refundRoutes = (deps: (env: Bindings) => ComplaintsDeps) =>
  new Hono<AppEnv>().post(`${ADMIN_COMPLAINTS_PATH}/:id/refund/:answer{confirm|reject}`, async (context) => {
    const session = context.get('session');
    const owner = { id: session.user.id, owner: session.teamRole === 'owner' };
    const answer = REFUND_ANSWERS.find((each) => each === context.req.param('answer')) ?? 'reject';
    const id = context.req.param('id');
    const result = await answerRefund(deps(context.env), owner, id, answer);
    if (result !== 'ok') return context.json({ error: result }, STATUS[result]);
    await recordAction(context.env, {
      memberId: owner.id,
      kind: 'refund',
      subject: id,
      action: answer,
      since: null,
    });
    return context.body(null, 204);
  });
