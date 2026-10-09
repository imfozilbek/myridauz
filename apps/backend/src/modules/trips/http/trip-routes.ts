import {
  ADMIN_TRIPS_PATH,
  DRIVER_SCHEDULE_PATH,
  DRIVER_TRIPS_PATH,
  TRIP_DAYS_PATH,
  TRIP_DIRECTIONS_PATH,
  TRIPS_PATH,
  dateSchema,
  daysQuerySchema,
  directionsQuerySchema,
  scheduleQuerySchema,
  tripInputSchema,
  tripPriceSchema,
  tripSearchSchema,
  tripTimeSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ONE } from '../../../shared/routes/one-id';
import type { TripsDeps } from '../application/ports';
import { lowerTripPrice, retimeTrip } from '../application/change';
import { publishTrip } from '../application/publish';
import { cancelTrip, myTrips, searchTrips, teamTrips, tripDetail } from '../application/read';
import { driverSchedule } from '../application/schedule';
import { directionCards, tripDays } from '../application/trip-counts';

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
  'trips.no_pitak': 400,
  'locations.not_found': 404,
  'locations.same_place': 422,
  'locations.inside_city': 422,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);

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
      // The driver moves the time later or lowers the price (G39, docs/104).
      .post(`${DRIVER_TRIPS_PATH}/${ONE}/time`, async (context) => {
        const input = tripTimeSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'trips.invalid_input');
        const driverId = context.get('session').user.id;
        const result = await retimeTrip(
          deps(context.env),
          driverId,
          context.req.param('id'),
          input.data.departAt,
        );
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .post(`${DRIVER_TRIPS_PATH}/${ONE}/price`, async (context) => {
        const input = tripPriceSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'trips.invalid_input');
        const driverId = context.get('session').user.id;
        const result = await lowerTripPrice(
          deps(context.env),
          driverId,
          context.req.param('id'),
          input.data.price,
        );
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .post(`${DRIVER_TRIPS_PATH}/${ONE}/cancel`, async (context) => {
        const driverId = context.get('session').user.id;
        const result = await cancelTrip(deps(context.env), driverId, context.req.param('id'));
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .get(TRIPS_PATH, async (context) => {
        const search = tripSearchSchema.safeParse(context.req.query());
        if (!search.success) return fail(context, 'trips.invalid_input');
        const viewer = context.get('session').user.id;
        return context.json({ trips: await searchTrips(deps(context.env), search.data, viewer) });
      })
      // How many trips go where (G59): the cards of «Qayerga borasiz?» and the days of «Safarlar».
      .get(TRIP_DIRECTIONS_PATH, async (context) => {
        const query = directionsQuerySchema.safeParse(context.req.query());
        if (!query.success) return fail(context, 'trips.invalid_input');
        const viewer = context.get('session').user.id;
        return context.json({ directions: await directionCards(deps(context.env), query.data.from, viewer) });
      })
      .get(TRIP_DAYS_PATH, async (context) => {
        const query = daysQuerySchema.safeParse(context.req.query());
        if (!query.success) return fail(context, 'trips.invalid_input');
        const viewer = context.get('session').user.id;
        const result = await tripDays(deps(context.env), query.data.from, query.data.to, viewer);
        return result.ok ? context.json(result.value) : fail(context, result.error);
      })
      .get(`${TRIPS_PATH}/${ONE}`, async (context) => {
        const viewer = context.get('session').user.id;
        const trip = await tripDetail(deps(context.env), context.req.param('id'), viewer);
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
