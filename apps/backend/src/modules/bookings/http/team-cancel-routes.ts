import { adminTripCancelPath, teamCancelSchema, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { BookingsDeps } from '../application/ports';
import { cancelTripByTeam } from '../application/team-cancel';
import { failWith } from './fail';

const STATUS = {
  'auth.not_admin': 403,
  'trips.invalid_input': 400,
  'trips.not_found': 404,
  'trips.wrong_status': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = failWith(STATUS);

type Done = (env: Bindings, memberId: number, tripId: string) => Promise<void>;

// The team cancels one trip with a reason in the admin app (Q5 of docs/111, G45); the journal keeps it.
export const teamCancelRoutes = (deps: (env: Bindings) => BookingsDeps, done: Done) =>
  new Hono<AppEnv>().post(adminTripCancelPath(':id'), async (context) => {
    const { isAdmin, user } = context.get('session');
    if (!isAdmin) return fail(context, 'auth.not_admin');
    const input = teamCancelSchema.safeParse(await context.req.json().catch(() => null));
    if (!input.success) return fail(context, 'trips.invalid_input');
    const tripId = context.req.param('id') ?? '';
    const result = await cancelTripByTeam(deps(context.env), tripId, input.data.reason);
    if (typeof result === 'string') return fail(context, result);
    await done(context.env, user.id, tripId);
    return context.body(null, 204);
  });
