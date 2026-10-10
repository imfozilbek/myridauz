import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { checkAccess } from '../application/check-access';
import type { UsersDeps } from '../application/ports';

const FORBIDDEN = 403;

// What a person blocked on the road still writes to finish the trip on the way (owner decision
// 10.10.2026, docs/158 Ж): the steps of the trip and of the meeting, the chat, the call, the feed.
const FINISH_TRIP = [
  /^\/driver\/trips\/[^/]+\/(depart|arrive)$/u,
  /^\/driver\/bookings\/[^/]+\/(came|met|no_show)$/u,
  /^\/passenger\/bookings\/[^/]+\/(came|boarded|arrived)$/u,
  /^\/chats\/[^/]+\/(ticket|messages)$/u,
  /^\/calls\//u,
  /^\/feed\/ticket$/u,
];
const finishesTrip = (method: string, path: string) =>
  method === 'GET' || FINISH_TRIP.some((step) => step.test(path));

// A blocked person can only learn that they are blocked (GET /me); everything else answers 403
// (docs/17). On the road the trip on the way is finished first: reading and its steps only.
export function accessGuard(deps: (env: Bindings) => UsersDeps): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const users = deps(context.env);
    const userId = context.get('session').user.id;
    const block = await checkAccess(users, userId);
    const allowed =
      !block || (finishesTrip(context.req.method, context.req.path) && (await users.riding(userId)));
    if (!allowed) return context.json({ error: 'users.blocked', until: block?.until ?? null }, FORBIDDEN);
    await next();
  };
}
