import { tripArrivePath, tripDepartPath, type ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ONE } from '../../../shared/routes/one-id';
import { arriveTrip, departTrip } from '../application/progress';
import type { TripsDeps } from '../application/ports';

// A refused step is a state of the trip, not a wrong question: 409 (docs/35).
const STATUS = {
  'trips.not_found': 404,
  'trips.wrong_status': 409,
  'trips.too_early_to_depart': 409,
  'trips.already_departed': 409,
  'trips.not_departed': 409,
  'trips.already_arrived': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

type Step = typeof departTrip | typeof arriveTrip;

// «Yoʻlga chiqdim» and «Yetib keldik» of the driver (G63, docs/35): only the own trip, another
// driver's trip is not found. The answer is the trip as the driver sees it now.
export function progressRoutes(deps: (env: Bindings) => TripsDeps) {
  const answer = async (context: Context<AppEnv>, step: Step, id: string) => {
    const result = await step(deps(context.env), context.get('session').user.id, id);
    return result.ok
      ? context.json(result.value)
      : context.json({ error: result.error }, STATUS[result.error]);
  };
  return new Hono<AppEnv>()
    .post(tripDepartPath(ONE), (context) => answer(context, departTrip, context.req.param('id') ?? ''))
    .post(tripArrivePath(ONE), (context) => answer(context, arriveTrip, context.req.param('id') ?? ''));
}
