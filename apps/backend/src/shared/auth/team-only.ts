import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../../env';

const FORBIDDEN = 403;

// The admin paths are the team's: the owner and the moderators (docs/02, docs/120).
export const teamOnly: MiddlewareHandler<AppEnv> = async (context, next) =>
  context.get('session').isAdmin ? next() : context.json({ error: 'auth.not_admin' }, FORBIDDEN);
