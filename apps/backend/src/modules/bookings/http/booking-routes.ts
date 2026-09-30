import {
  ADMIN_TRIPS_PATH,
  bookingInputSchema,
  DRIVER_BOOKINGS_PATH,
  PASSENGER_BOOKINGS_PATH,
  pickupInputSchema,
  TRIPS_PATH,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { answer, confirm, driverBookings, teamTripBookings } from '../application/answer';
import type { BookingsDeps } from '../application/ports';
import { pickupFromMap } from '../application/pickup';
import { markProgress } from '../application/progress';
import { cancelByPassenger, passengerBookings, requestBooking } from '../application/request';
import { failWith, ONE } from './fail';

const STATUS = {
  'auth.not_admin': 403,
  'bookings.not_found': 404,
  'bookings.invalid_input': 400,
  'bookings.too_many': 409,
  'bookings.no_seats': 409,
  'bookings.own_trip': 422,
  'bookings.wrong_status': 409,
  'bookings.departed': 409,
  'bookings.outside_country': 422,
  'wallet.not_enough': 402,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = failWith(STATUS);

// A passenger asks and cancels; the driver confirms, declines or cancels (docs/35).
export function bookingRoutes(deps: (env: Bindings) => BookingsDeps) {
  return new Hono<AppEnv>()
    .post(`${TRIPS_PATH}/${ONE}/bookings`, async (context) => {
      const input = bookingInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'bookings.invalid_input');
      const passengerId = context.get('session').user.id;
      const result = await requestBooking(
        deps(context.env),
        passengerId,
        context.req.param('id'),
        input.data.seats,
      );
      return result.ok ? context.json(result.value, 201) : fail(context, result.error);
    })
    .get(PASSENGER_BOOKINGS_PATH, async (context) =>
      context.json({ bookings: await passengerBookings(deps(context.env), context.get('session').user.id) }),
    )
    .post(`${PASSENGER_BOOKINGS_PATH}/${ONE}/cancel`, async (context) => {
      const passengerId = context.get('session').user.id;
      const result = await cancelByPassenger(deps(context.env), passengerId, context.req.param('id'));
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .post(`${PASSENGER_BOOKINGS_PATH}/${ONE}/pickup`, async (context) => {
      const point = pickupInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!point.success) return fail(context, 'bookings.invalid_input');
      const passengerId = context.get('session').user.id;
      const result = await pickupFromMap(deps(context.env), passengerId, context.req.param('id'), point.data);
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .post(`${PASSENGER_BOOKINGS_PATH}/${ONE}/:step{boarded|arrived}`, async (context) => {
      const step = context.req.param('step') === 'boarded' ? 'boarded' : 'arrived';
      const passengerId = context.get('session').user.id;
      const result = await markProgress(deps(context.env), passengerId, context.req.param('id'), step);
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .get(DRIVER_BOOKINGS_PATH, async (context) =>
      context.json({ bookings: await driverBookings(deps(context.env), context.get('session').user.id) }),
    )
    .post(`${DRIVER_BOOKINGS_PATH}/${ONE}/:action{confirm|decline|cancel}`, async (context) => {
      const driverId = context.get('session').user.id;
      const id = context.req.param('id');
      const action = context.req.param('action');
      const result =
        action === 'confirm'
          ? await confirm(deps(context.env), driverId, id)
          : await answer(deps(context.env), driverId, id, action === 'decline' ? 'decline' : 'driver_cancel');
      return result.ok ? context.json(result.value) : fail(context, result.error);
    })
    .get(`${ADMIN_TRIPS_PATH}/${ONE}/bookings`, async (context) =>
      context.get('session').isAdmin
        ? context.json({ bookings: await teamTripBookings(deps(context.env), context.req.param('id')) })
        : fail(context, 'auth.not_admin'),
    );
}
