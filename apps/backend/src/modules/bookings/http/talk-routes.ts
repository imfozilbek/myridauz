import {
  DRIVER_MONTH_PATH,
  DRIVER_REQUESTS_PATH,
  DRIVER_TRIPS_PATH,
  requestTripInputSchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { driverMonth } from '../application/month';
import type { BookingsDeps } from '../application/ports';
import { offerSalonTrip, openSalonTrip } from '../application/salon-trip';
import { openTalk } from '../application/talks';
import { ONE } from '../../../shared/routes/one-id';
import { failWith } from './fail';

const STATUS = {
  'bookings.not_found': 404,
  'bookings.invalid_input': 400,
  'bookings.no_seats': 409,
  'bookings.salon_taken': 409,
  'bookings.own_trip': 422,
  'bookings.wrong_status': 409,
  'bookings.departed': 409,
  'bookings.wrong_mode': 422,
  'bookings.outside_area': 422,
  'trips.not_found': 404,
  'trips.not_driver': 403,
  'trips.price_out_of_bounds': 422,
  'trips.too_many': 409,
  'trips.too_soon': 422,
  'trips.busy': 409,
  'trips.no_pitak': 422,
  'trips.in_past': 422,
  'wallet.not_enough': 402,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = failWith(STATUS);

// Path 7 of the driver (G64, docs/118): a talk about a request before an offer, a salon trip from a
// «Boʻsh salon kerak» request, its opening for everybody, the month of the driver.
export function talkRoutes(deps: (env: Bindings) => BookingsDeps) {
  return new Hono<AppEnv>()
    .post(`${DRIVER_REQUESTS_PATH}/${ONE}/talk`, async (context) => {
      const driverId = context.get('session').user.id;
      const result = await openTalk(deps(context.env), driverId, context.req.param('id'));
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .post(`${DRIVER_REQUESTS_PATH}/${ONE}/trip`, async (context) => {
      const input = requestTripInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'bookings.invalid_input');
      const driverId = context.get('session').user.id;
      const requestId = context.req.param('id');
      const result = await offerSalonTrip(deps(context.env), driverId, requestId, input.data.departAt);
      return result.ok ? context.json(result.value, 201) : fail(context, result.error);
    })
    .post(`${DRIVER_TRIPS_PATH}/${ONE}/open`, async (context) => {
      const driverId = context.get('session').user.id;
      const result = await openSalonTrip(deps(context.env), driverId, context.req.param('id'));
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .get(DRIVER_MONTH_PATH, async (context) =>
      context.json(await driverMonth(deps(context.env), context.get('session').user.id)),
    );
}
