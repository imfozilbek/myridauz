import { type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { createShare, follow, sharedTrip, stopSharing } from '../application/shares';
import type { SharesDeps } from '../application/ports';

const STATUS = {
  'shares.not_found': 404,
  'shares.wrong_status': 409,
  'shares.too_many': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
type Failure = keyof typeof STATUS;

// The passenger shares and stops sharing; close people read the trip by the token (docs/43).
export function shareRoutes(deps: (env: Bindings) => SharesDeps) {
  const fail = (code: Failure) => Response.json({ error: code }, { status: STATUS[code] });
  return new Hono<AppEnv>()
    .post('/passenger/bookings/:id/share', async (context) => {
      const result = await createShare(
        deps(context.env),
        context.get('session').user.id,
        context.req.param('id'),
      );
      return result.ok ? context.json(result.value, 201) : fail(result.error);
    })
    .post('/passenger/bookings/:id/share/stop', async (context) => {
      const stopped = await stopSharing(
        deps(context.env),
        context.get('session').user.id,
        context.req.param('id'),
      );
      return stopped ? context.body(null, 204) : fail('shares.not_found');
    })
    .get('/shared/:token', async (context) => {
      const trip = await sharedTrip(deps(context.env), context.req.param('token'));
      return trip ? context.json(trip) : fail('shares.not_found');
    })
    .post('/shared/:token/follow', async (context) => {
      const result = await follow(
        deps(context.env),
        context.req.param('token'),
        context.get('session').user.id,
      );
      return result.ok ? context.body(null, 204) : fail(result.error);
    });
}
