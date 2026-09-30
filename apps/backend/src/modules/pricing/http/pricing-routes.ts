import {
  ADMIN_DIRECTIONS_PATH,
  ADMIN_PRICING_PATH,
  ADMIN_PRICING_PREVIEW_PATH,
  ADMIN_PRICING_ROLLBACK_PATH,
  directionPriceSchema,
  distanceQuerySchema,
  PRICE_RECOMMENDATION_PATH,
  PUBLIC_PRICE_PATH,
  pricingVariablesSchema,
  rollbackSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import {
  changeVariables,
  directions,
  preview,
  pricingState,
  rollback,
  setDirection,
} from '../application/admin';
import type { PricingDeps } from '../application/ports';
import { ownerOnly } from '../../../shared/auth/owner-only';
import { recommendPrice } from '../application/recommend';

const STATUS = {
  'auth.not_admin': 403,
  'pricing.not_found': 404,
  'pricing.invalid_input': 400,
  'pricing.out_of_bounds': 422,
  'locations.not_found': 404,
  'locations.same_place': 422,
  'locations.inside_city': 422,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

// A price changes only when the team changes the formula: the landing may keep it for an hour.
const PUBLIC_CACHE = 'public, max-age=3600';

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const body = (context: Context<AppEnv>) => context.req.json().catch(() => null);

// The recommendation for everyone; the formula, the directions and the history for the team (docs/23).
export function pricingRoutes(deps: (env: Bindings) => PricingDeps) {
  return (
    new Hono<AppEnv>()
      .get(PRICE_RECOMMENDATION_PATH, async (context) => {
        const query = distanceQuerySchema.safeParse(context.req.query());
        if (!query.success) return fail(context, 'pricing.invalid_input');
        const result = await recommendPrice(deps(context.env), query.data.from, query.data.to);
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      // The same recommendation for the landing, without a signature and without personal data (docs/59).
      .get(PUBLIC_PRICE_PATH, async (context) => {
        const query = distanceQuerySchema.safeParse(context.req.query());
        if (!query.success) return fail(context, 'pricing.invalid_input');
        const result = await recommendPrice(deps(context.env), query.data.from, query.data.to);
        if (!result.ok) return fail(context, result.error);
        const { from, to, km, price } = result.value;
        context.header('cache-control', PUBLIC_CACHE);
        return context.json({ from, to, km, price });
      })
      .use(`${ADMIN_PRICING_PATH}/*`, async (context, next) =>
        context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
      )
      .use(ADMIN_PRICING_PATH, async (context, next) =>
        context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
      )
      .get(ADMIN_PRICING_PATH, async (context) => context.json(await pricingState(deps(context.env))))
      .post(ADMIN_PRICING_PATH, ownerOnly, async (context) => {
        const input = pricingVariablesSchema.safeParse(await body(context));
        if (!input.success) return fail(context, 'pricing.invalid_input');
        const by = context.get('session').user.id;
        return context.json(await changeVariables(deps(context.env), input.data, by));
      })
      .post(ADMIN_PRICING_PREVIEW_PATH, async (context) => {
        const input = pricingVariablesSchema.safeParse(await body(context));
        if (!input.success) return fail(context, 'pricing.invalid_input');
        return context.json(await preview(deps(context.env), input.data));
      })
      .post(ADMIN_PRICING_ROLLBACK_PATH, ownerOnly, async (context) => {
        const input = rollbackSchema.safeParse(await body(context));
        if (!input.success) return fail(context, 'pricing.invalid_input');
        const result = await rollback(deps(context.env), input.data.version, context.get('session').user.id);
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .get(ADMIN_DIRECTIONS_PATH, async (context) =>
        context.json({ directions: await directions(deps(context.env)) }),
      )
      .put(ADMIN_DIRECTIONS_PATH, ownerOnly, async (context) => {
        const input = directionPriceSchema.safeParse(await body(context));
        if (!input.success) return fail(context, 'pricing.invalid_input');
        const result = await setDirection(deps(context.env), input.data, context.get('session').user.id);
        return result.ok ? context.json({ directions: result.value }) : fail(context, result.error);
      })
  );
}
