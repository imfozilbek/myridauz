import type { Bindings } from '../../env';
import { analyticsRoutes } from './http/analytics-routes';
import { analyticsEngineSink } from './infrastructure/analytics-engine-sink';
import { createMemorySink } from './infrastructure/memory-sink';

const local = createMemorySink();
const sinkFor = (env: Bindings) => (env.ANALYTICS ? analyticsEngineSink(env.ANALYTICS) : local.sink);

export const analyticsModule = analyticsRoutes(sinkFor, Date.now);
export const localAnalyticsRows = local.rows;
