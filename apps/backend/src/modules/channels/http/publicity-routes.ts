import { DRIVER_TRIPS_PATH, TRIPS_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { afterResponse } from '../../../shared/worker/after-response';
import { recordView, tripPublicity, type PublicityDeps } from '../application/publicity';

const STATUS = { 'trips.not_found': 404 } as const satisfies Partial<Record<ApiErrorCode, number>>;
const ONE = ':id{[0-9a-f-]{36}}';

// What the driver sees after the publishing (G63, docs/119), and the count behind «N kishi koʻrdi».
export function publicityRoutes(deps: (env: Bindings) => PublicityDeps) {
  return (
    new Hono<AppEnv>()
      // The trip page of the passenger app: a search result, a channel post button and a shared link
      // all open it. The view is written after the answer: the page never waits for it.
      .use(`${TRIPS_PATH}/${ONE}`, async (context, next) => {
        const [tripId, viewer] = [context.req.param('id'), context.get('session').user.id];
        await next();
        if (context.req.method !== 'GET' || context.res.status !== 200) return;
        await afterResponse(context, () => recordView(deps(context.env), tripId, viewer));
      })
      .get(`${DRIVER_TRIPS_PATH}/${ONE}/publicity`, async (context) => {
        const driverId = context.get('session').user.id;
        const publicity = await tripPublicity(deps(context.env), driverId, context.req.param('id'));
        const error = 'trips.not_found';
        return publicity ? context.json(publicity) : context.json({ error }, STATUS[error]);
      })
  );
}
