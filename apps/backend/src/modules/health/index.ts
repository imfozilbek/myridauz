import { healthRoutes } from './http/health-routes';
import { systemClock } from './infrastructure/system-clock';

export const healthModule = healthRoutes(systemClock);
