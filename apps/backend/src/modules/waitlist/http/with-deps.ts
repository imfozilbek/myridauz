import type { Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';

const UNAVAILABLE = 503;

// A handler of the list gets its deps; without D1 the list is not there (local runs, docs/181).
export const withDeps =
  <D>(
    deps: (env: Bindings) => D | null,
    handler: (context: Context<AppEnv>, found: D) => Promise<Response>,
  ) =>
  async (context: Context<AppEnv>) => {
    const found = deps(context.env);
    return found ? handler(context, found) : context.json({ error: 'waitlist.unavailable' }, UNAVAILABLE);
  };
