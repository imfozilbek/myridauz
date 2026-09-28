import { HEALTH_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { Clock } from '../application/clock';
import { getHealth } from '../application/get-health';

export function healthRoutes(clock: Clock) {
  return new Hono().get(HEALTH_PATH, (context) => context.json(getHealth(clock)));
}
