import type { MiddlewareHandler } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { checkAccess } from '../application/check-access';
import type { UsersDeps } from '../application/ports';

const FORBIDDEN = 403;

// A blocked person can only learn that they are blocked (GET /me); everything else answers 403 (docs/17).
export function accessGuard(deps: (env: Bindings) => UsersDeps): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const block = await checkAccess(deps(context.env), context.get('session').user.id);
    if (block) return context.json({ error: 'users.blocked', until: block.until }, FORBIDDEN);
    await next();
  };
}
