import type { HealthResponse } from '@platform/contracts';
import { createHealthReport } from '../domain/health-report';
import type { Clock } from './clock';

export function getHealth(clock: Clock): HealthResponse {
  return createHealthReport(clock.now());
}
