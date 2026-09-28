import { Hono } from 'hono';
import type { AppEnv } from './env';
import { analyticsModule } from './modules/analytics';
import { healthModule } from './modules/health';

export const app = new Hono<AppEnv>().route('/', healthModule).route('/', analyticsModule);
