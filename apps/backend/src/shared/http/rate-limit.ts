import type { Context, Next } from 'hono';
import type { AppEnv, Bindings } from '../../env';

type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };
type LimitBinding = 'ACTIONS_LIMIT' | 'SEARCH_LIMIT' | 'ANALYTICS_LIMIT';
const TOO_MANY = 429;

// The person after the signature, the address before it (CGNAT: many people, one address).
const whoIs = (context: Context<AppEnv>) =>
  context.get('session')?.user.id ?? context.req.header('cf-connecting-ip') ?? 'unknown';

// Workers Rate Limiting (G42, docs/111): too many requests of one person or one address get 429
// with a code. writesOnly: reading own lists is never limited. No binding (tests, the stand by
// default): no limit.
export const rateLimit =
  (binding: LimitBinding, group: string, writesOnly = false) =>
  async (context: Context<AppEnv>, next: Next) => {
    const limiter = (context.env as Bindings | undefined)?.[binding] as Limiter | undefined;
    if (!limiter || (writesOnly && context.req.method === 'GET')) return next();
    const { success } = await limiter.limit({ key: `${group}:${whoIs(context)}` });
    return success ? next() : context.json({ error: 'rate.limited' }, TOO_MANY);
  };
