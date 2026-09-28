import type { DataPoint } from '../domain/data-point';

// Port: where analytics rows are written (Analytics Engine in production, memory locally).
export type AnalyticsSink = {
  write(point: DataPoint): void;
};
