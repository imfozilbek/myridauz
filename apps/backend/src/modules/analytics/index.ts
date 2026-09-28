import type { Bindings } from '../../env';
import { serverDataPoint } from './domain/data-point';
import { analyticsRoutes } from './http/analytics-routes';
import { analyticsEngineSink } from './infrastructure/analytics-engine-sink';
import { createMemorySink } from './infrastructure/memory-sink';

const local = createMemorySink();
const sinkFor = (env: Bindings) => (env.ANALYTICS ? analyticsEngineSink(env.ANALYTICS) : local.sink);

export const analyticsModule = analyticsRoutes(sinkFor, Date.now);
export const localAnalyticsRows = local.rows;

// Events the backend records itself (docs/29): no personal data, only the name.
export const recordServerEvent = (env: Bindings, name: 'driver_approved') =>
  sinkFor(env).write(serverDataPoint(name, Date.now()));
