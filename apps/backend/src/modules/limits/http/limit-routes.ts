import type { BrandConfig } from '@platform/brands';
import {
  ADMIN_LIMITS_PATH,
  LIMIT_KEYS,
  limitChangeSchema,
  limitFits,
  limitIn,
  PUBLIC_LIMITS_PATH,
  type LimitKey,
  type OwnerLimits,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { teamOnly } from '../../../shared/auth/team-only';
import type { LimitStore } from '../application/ports';

type LimitDeps = {
  readonly store: (env: Bindings) => LimitStore;
  readonly brand: (env: Bindings) => BrandConfig;
  readonly base: (env: Bindings) => BrandConfig;
  readonly changed: (
    env: Bindings,
    key: LimitKey,
    by: number,
    values: OwnerLimits['values'],
    after: number,
  ) => Promise<void>;
  readonly name: (env: Bindings, id: number) => Promise<string>;
  readonly owners: () => OwnerLimits['values'];
};
const HISTORY = 50;
const PUBLIC_MAX_AGE = 60;
const BAD_REQUEST = 400;
const isKey = (key: string): key is LimitKey => (LIMIT_KEYS as readonly string[]).includes(key);

// The team hours stay a window: the opening before the closing (G34).
function fitsWith(brand: BrandConfig, key: LimitKey, value: number): boolean {
  const { from, to } = brand.moderation.hours;
  if (key === 'moderation.hours.from') return value < to;
  if (key === 'moderation.hours.to') return value > from;
  return true;
}

// «Cheklovlar» (G75, docs/128 §4): the owner reads every limit with its default and the history, and
// changes one within its rule; a moderator does not.
export const limitRoutes = (deps: LimitDeps) => {
  const state = async (context: Context<AppEnv>) => {
    const { env } = context;
    const [brand, base] = [deps.brand(env), deps.base(env)];
    const changes = await deps.store(env).history(HISTORY);
    const history = await Promise.all(
      changes.map(async ({ by, ...change }) => ({ ...change, by: await deps.name(env, by) })),
    );
    const limits = LIMIT_KEYS.map((key) => ({ key, value: limitIn(brand, key), base: limitIn(base, key) }));
    return context.json({ limits, history });
  };
  return (
    new Hono<AppEnv>()
      .use(ADMIN_LIMITS_PATH, teamOnly, ownerOnly)
      .use(`${ADMIN_LIMITS_PATH}/*`, teamOnly, ownerOnly)
      .get(ADMIN_LIMITS_PATH, state)
      // Every Mini App reads the owner's values over its brand config (G75); a minute in the cache.
      .get(PUBLIC_LIMITS_PATH, (context) => {
        context.header('cache-control', `public, max-age=${PUBLIC_MAX_AGE}`);
        return context.json({ values: deps.owners() });
      })
      .put(`${ADMIN_LIMITS_PATH}/:key`, async (context) => {
        const { env } = context;
        const key = context.req.param('key');
        const input = limitChangeSchema.safeParse(await context.req.json().catch(() => null));
        const brand = deps.brand(env);
        if (
          !isKey(key) ||
          !input.success ||
          !limitFits(key, input.data.value) ||
          !fitsWith(brand, key, input.data.value)
        )
          return context.json({ error: 'team.invalid_input' }, BAD_REQUEST);
        const by = context.get('session').user.id;
        const change = { key, before: limitIn(brand, key), after: input.data.value, by, at: Date.now() };
        await deps.store(env).change(change);
        await deps.changed(env, key, by, await deps.store(env).values(), change.after);
        return state(context);
      })
  );
};
