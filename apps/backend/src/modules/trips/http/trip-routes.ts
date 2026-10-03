import {
  ADMIN_TRIPS_PATH,
  DRIVER_SCHEDULE_PATH,
  DRIVER_TRIPS_PATH,
  TRIPS_PATH,
  dateSchema,
  scheduleQuerySchema,
  tripInputSchema,
  tripSearchSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { TripsDeps } from '../application/ports';
import { publishTrip } from '../application/publish';
import { cancelTrip, myTrips, searchTrips, teamTrips, tripDetail } from '../application/read';
import { driverSchedule } from '../application/schedule';

const STATUS = {
  'auth.not_admin': 403,
  'trips.not_found': 404,
  'trips.invalid_input': 400,
  'trips.not_driver': 403,
  'trips.too_many': 409,
  'trips.too_many_seats': 422,
  'trips.price_out_of_bounds': 422,
  'trips.in_past': 422,
  'trips.too_soon': 422,
  'trips.busy': 409,
  'trips.wrong_status': 409,
  'locations.not_found': 404,
  'locations.same_place': 422,
  'locations.inside_city': 422,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const ONE = ':id{[0-9a-f-]{36}}';

// Drivers publish and cancel their trips; passengers search and open them (docs/09).
export function tripRoutes(deps: (env: Bindings) => TripsDeps) {
  return (
    new Hono<AppEnv>()
      .get(DRIVER_TRIPS_PATH, async (context) =>
        context.json({ trips: await myTrips(deps(context.env), context.get('session').user.id) }),
      )
      .post(DRIVER_TRIPS_PATH, async (context) => {
        const input = tripInputSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'trips.invalid_input');
        const result = await publishTrip(deps(context.env), context.get('session').user.id, input.data);
        return result.ok ? context.json(result.value, 201) : fail(context, result.error);
      })
      // The busy times of a new trip on a route: the day and time screen shows only the free ones (docs/103).
      .get(DRIVER_SCHEDULE_PATH, async (context) => {
        const route = scheduleQuerySchema.safeParse(context.req.query());
        if (!route.success) return fail(context, 'trips.invalid_input');
        const tripsDeps = deps(context.env);
        const recommendation = await tripsDeps.recommend(route.data.from, route.data.to);
        if (!recommendation.ok) return fail(context, recommendation.error);
        const { km } = recommendation.value;
        const driverId = context.get('session').user.id;
        return context.json(await driverSchedule(tripsDeps, driverId, { ...route.data, km }));
      })
      .post(`${DRIVER_TRIPS_PATH}/${ONE}/cancel`, async (context) => {
        const driverId = context.get('session').user.id;
        const result = await cancelTrip(deps(context.env), driverId, context.req.param('id'));
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .get(TRIPS_PATH, async (context) => {
        const search = tripSearchSchema.safeParse(context.req.query());
        if (!search.success) return fail(context, 'trips.invalid_input');
        return context.json({ trips: await searchTrips(deps(context.env), search.data) });
      })
      .get(`${TRIPS_PATH}/${ONE}`, async (context) => {
        const trip = await tripDetail(deps(context.env), context.req.param('id'));
        return trip ? context.json(trip) : fail(context, 'trips.not_found');
      })
      .get(ADMIN_TRIPS_PATH, async (context) => {
        if (!context.get('session').isAdmin) return fail(context, 'auth.not_admin');
        // One day of the team's list (docs/90 F-A6).
        const date = dateSchema.safeParse(context.req.query('date'));
        if (!date.success) return fail(context, 'trips.invalid_input');
        return context.json({ trips: await teamTrips(deps(context.env), date.data) });
      })
  );
}
