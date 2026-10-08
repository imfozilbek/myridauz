import { DRIVER_BOOKINGS_PATH, DRIVER_MEET_STEPS, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { markMeeting } from '../application/meeting';
import type { BookingsDeps } from '../application/ports';
import { ONE } from '../../../shared/routes/one-id';
import { failWith } from './fail';

const STATUS = {
  'bookings.not_found': 404,
  'bookings.wrong_status': 409,
  'bookings.not_meeting_time': 409,
  'bookings.already_met': 409,
  'bookings.already_no_show': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = failWith(STATUS);

// The driver at each point of the trip (docs/126, G63): «Men keldim», then «Keldi» or «Kelmadi».
export const meetingRoutes = (deps: (env: Bindings) => BookingsDeps) =>
  new Hono<AppEnv>().post(`${DRIVER_BOOKINGS_PATH}/${ONE}/:step{came|met|no_show}`, async (context) => {
    const step = DRIVER_MEET_STEPS.find((each) => each === context.req.param('step')) ?? 'came';
    const driverId = context.get('session').user.id;
    const result = await markMeeting(deps(context.env), driverId, context.req.param('id'), step);
    return result.ok ? context.json(result.value) : fail(context, result.error);
  });
