import { Hono } from 'hono';
import { healthModule } from './modules/health';

export const app = new Hono().route('/', healthModule);
