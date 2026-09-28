import type { AnalyticsBatch } from '@platform/contracts';
import { toDataPoint } from '../domain/data-point';
import type { AnalyticsSink } from './analytics-sink';

export function recordEvents(sink: AnalyticsSink, batch: AnalyticsBatch, receivedAt: number): number {
  for (const event of batch.events) sink.write(toDataPoint(event, receivedAt));
  return batch.events.length;
}
