import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../../env';

const FORBIDDEN = 403;

// Money, prices, distances and channels are the owner's (docs/02); a moderator only reads them.
export const ownerOnly: MiddlewareHandler<AppEnv> = async (context, next) =>
  context.get('session').teamRole === 'owner' ? next() : context.json({ error: 'auth.not_owner' }, FORBIDDEN);
