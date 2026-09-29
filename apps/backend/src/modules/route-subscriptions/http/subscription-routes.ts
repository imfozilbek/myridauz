import {
  DRIVER_SUBSCRIPTIONS_PATH,
  PASSENGER_SUBSCRIPTIONS_PATH,
  subscriptionInputSchema,
  type ApiErrorCode,
  type SubscriptionKind,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { mySubscriptions, renew, subscribe, unsubscribe } from '../application/manage';
import type { SubscriptionsDeps } from '../application/ports';

const STATUS = {
  'subscriptions.not_found': 404,
  'subscriptions.too_many': 409,
  'subscriptions.invalid_input': 400,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
type Failure = keyof typeof STATUS;

const fail = (code: Failure) => Response.json({ error: code }, { status: STATUS[code] });

// The same four routes for passengers (trips) and drivers (requests), docs/24.
function routesOf(base: string, kind: SubscriptionKind, deps: (env: Bindings) => SubscriptionsDeps) {
  return new Hono<AppEnv>()
    .get(base, async (context) => {
      const subscriptions = await mySubscriptions(deps(context.env), context.get('session').user.id, kind);
      return context.json({ subscriptions });
    })
    .post(base, async (context) => {
      const input = subscriptionInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('subscriptions.invalid_input');
      const result = await subscribe(deps(context.env), context.get('session').user.id, kind, input.data);
      return result.ok ? context.json(result.value, 201) : fail(result.error);
    })
    .delete(`${base}/:id`, async (context) => {
      const userId = context.get('session').user.id;
      const removed = await unsubscribe(deps(context.env), userId, kind, context.req.param('id'));
      return removed ? context.body(null, 204) : fail('subscriptions.not_found');
    })
    .post(`${base}/:id/renew`, async (context) => {
      const userId = context.get('session').user.id;
      const result = await renew(deps(context.env), userId, kind, context.req.param('id'));
      return result.ok ? context.json(result.value) : fail(result.error);
    });
}

export const subscriptionRoutes = (deps: (env: Bindings) => SubscriptionsDeps) =>
  new Hono<AppEnv>()
    .route('/', routesOf(PASSENGER_SUBSCRIPTIONS_PATH, 'trips', deps))
    .route('/', routesOf(DRIVER_SUBSCRIPTIONS_PATH, 'requests', deps));
