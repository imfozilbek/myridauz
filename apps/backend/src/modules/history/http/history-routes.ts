import { DRIVER_HISTORY_PATH, PASSENGER_HISTORY_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { historyOf, type HistoryDeps } from '../application/history';

// "Safarlar tarixi" of a passenger and of a driver (G18).
export function historyRoutes(deps: (env: Bindings) => HistoryDeps) {
  return new Hono<AppEnv>()
    .get(PASSENGER_HISTORY_PATH, async (context) =>
      context.json({
        trips: await historyOf(deps(context.env), context.get('session').user.id, 'passenger'),
      }),
    )
    .get(DRIVER_HISTORY_PATH, async (context) =>
      context.json({ trips: await historyOf(deps(context.env), context.get('session').user.id, 'driver') }),
    );
}
