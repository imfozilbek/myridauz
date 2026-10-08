import { DRIVER_TRIPS_PATH, TRIPS_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ONE } from '../../../shared/routes/one-id';
import { afterResponse } from '../../../shared/worker/after-response';
import { recordView, tripPublicity, type PublicityDeps } from '../application/publicity';

const STATUS = { 'trips.not_found': 404 } as const satisfies Partial<Record<ApiErrorCode, number>>;
const NO_CONTENT = 204;

// What the driver sees after the publishing (G63, docs/119), and the count behind «N koʻrdi».
export function publicityRoutes(deps: (env: Bindings) => PublicityDeps) {
  return (
    new Hono<AppEnv>()
      // The trip page of the passenger app says it was opened, once per showing: a search result, a
      // channel post button and a shared link all lead there. The view is written after the answer.
      .post(`${TRIPS_PATH}/${ONE}/view`, async (context) => {
        const [tripId, viewer] = [context.req.param('id'), context.get('session').user.id];
        await afterResponse(context, () => recordView(deps(context.env), tripId, viewer));
        return context.body(null, NO_CONTENT);
      })
      .get(`${DRIVER_TRIPS_PATH}/${ONE}/publicity`, async (context) => {
        const driverId = context.get('session').user.id;
        const publicity = await tripPublicity(deps(context.env), driverId, context.req.param('id'));
        const error = 'trips.not_found';
        return publicity ? context.json(publicity) : context.json({ error }, STATUS[error]);
      })
  );
}
