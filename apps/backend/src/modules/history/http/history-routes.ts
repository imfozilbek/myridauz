import {
  DRIVER_HISTORY_PATH,
  DRIVER_STANDING_PATH,
  PASSENGER_HISTORY_PATH,
  PASSENGER_STANDING_PATH,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { historyOf, type HistoryDeps } from '../application/history';
import { standingOf } from '../application/standing';

// "Safarlar tarixi" of a passenger and of a driver (G18) and the numbers on top of «Profil» (G65).
export function historyRoutes(deps: (env: Bindings) => HistoryDeps) {
  return new Hono<AppEnv>()
    .get(PASSENGER_HISTORY_PATH, async (context) =>
      context.json({
        trips: await historyOf(deps(context.env), context.get('session').user.id, 'passenger'),
      }),
    )
    .get(DRIVER_HISTORY_PATH, async (context) =>
      context.json({ trips: await historyOf(deps(context.env), context.get('session').user.id, 'driver') }),
    )
    .get(PASSENGER_STANDING_PATH, async (context) =>
      context.json(await standingOf(deps(context.env), context.get('session').user.id, 'passenger')),
    )
    .get(DRIVER_STANDING_PATH, async (context) =>
      context.json(await standingOf(deps(context.env), context.get('session').user.id, 'driver')),
    );
}
