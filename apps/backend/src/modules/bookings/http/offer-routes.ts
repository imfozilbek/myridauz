import {
  DRIVER_OFFERS_PATH,
  DRIVER_REQUESTS_PATH,
  offerInputSchema,
  PASSENGER_OFFERS_PATH,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { acceptOffer, declineOffer } from '../application/accept';
import { driverOffers, passengerOffers, sendOffer } from '../application/offers';
import type { BookingsDeps } from '../application/ports';
import { failWith, ONE } from './fail';

const STATUS = {
  'bookings.not_found': 404,
  'bookings.invalid_input': 400,
  'bookings.no_seats': 409,
  'bookings.own_trip': 422,
  'bookings.wrong_status': 409,
  'trips.not_driver': 403,
  'trips.price_out_of_bounds': 422,
  'wallet.not_enough': 402,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = failWith(STATUS);

// The second way (docs/35): a driver offers on a request, the passenger accepts or declines.
export function offerRoutes(deps: (env: Bindings) => BookingsDeps) {
  return new Hono<AppEnv>()
    .post(`${DRIVER_REQUESTS_PATH}/${ONE}/offers`, async (context) => {
      const input = offerInputSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'bookings.invalid_input');
      const driverId = context.get('session').user.id;
      const result = await sendOffer(deps(context.env), driverId, context.req.param('id'), input.data);
      return result.ok ? context.json(result.value, 201) : fail(context, result.error);
    })
    .get(DRIVER_OFFERS_PATH, async (context) =>
      context.json({ offers: await driverOffers(deps(context.env), context.get('session').user.id) }),
    )
    .get(PASSENGER_OFFERS_PATH, async (context) =>
      context.json({ offers: await passengerOffers(deps(context.env), context.get('session').user.id) }),
    )
    .post(`${PASSENGER_OFFERS_PATH}/${ONE}/:action{accept|decline}`, async (context) => {
      const passengerId = context.get('session').user.id;
      const id = context.req.param('id');
      const run = context.req.param('action') === 'accept' ? acceptOffer : declineOffer;
      const result = await run(deps(context.env), passengerId, id);
      return result.ok ? context.json(result.value) : fail(context, result.error);
    });
}
