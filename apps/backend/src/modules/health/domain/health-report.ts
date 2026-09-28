import type { HealthResponse } from '@platform/contracts';

export function createHealthReport(now: Date): HealthResponse {
  return { status: 'ok', time: now.toISOString() };
}
