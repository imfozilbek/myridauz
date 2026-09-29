import {
  DRIVER_REQUESTS_PATH,
  PASSENGER_REQUESTS_PATH,
  requestSearchSchema,
  rideRequestInputSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { RequestsDeps } from '../application/ports';
import { cancelRequest, myRequests, publishRequest, searchRequests } from '../application/use-cases';

const STATUS = {
  'trips.not_found': 404,
  'trips.invalid_input': 400,
  'trips.not_driver': 403,
  'trips.too_many': 409,
  'trips.price_out_of_bounds': 422,
  'trips.in_past': 422,
  'trips.wrong_status': 409,
  'locations.not_found': 404,
  'locations.same_place': 422,
  'locations.inside_city': 422,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const ONE = ':id{[0-9a-f-]{36}}';

// Passengers publish and cancel requests; drivers find them (docs/09).
export function requestRoutes(deps: (env: Bindings) => RequestsDeps) {
  return new Hono<AppEnv>()
    .get(PASSENGER_REQUESTS_PATH, async (context) =>
      context.json({ requests: await myRequests(deps(context.env), context.get('session').user.id) }),
    )
    .post(PASSENGER_REQUESTS_PATH, async (context) => {
      const input = rideRequestInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'trips.invalid_input');
      const result = await publishRequest(deps(context.env), context.get('session').user.id, input.data);
      return result.ok ? context.json(result.value, 201) : fail(context, result.error);
    })
    .post(`${PASSENGER_REQUESTS_PATH}/${ONE}/cancel`, async (context) => {
      const passengerId = context.get('session').user.id;
      const result = await cancelRequest(deps(context.env), passengerId, context.req.param('id'));
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .get(DRIVER_REQUESTS_PATH, async (context) => {
      const search = requestSearchSchema.safeParse(context.req.query());
      if (!search.success) return fail(context, 'trips.invalid_input');
      const result = await searchRequests(deps(context.env), context.get('session').user.id, search.data);
      return result.ok ? context.json({ requests: result.value }) : fail(context, result.error);
    });
}
