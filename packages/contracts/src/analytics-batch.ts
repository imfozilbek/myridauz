import { z } from 'zod';
import { analyticsEventSchema, MAX_ANALYTICS_BATCH, type AnalyticsEvent } from './analytics';

export type AnalyticsBatch = { readonly events: readonly AnalyticsEvent[] };

const envelopeSchema = z.object({ events: z.array(z.unknown()).min(1).max(MAX_ANALYTICS_BATCH) });

// One bad event never costs the whole batch (G43): an old Mini App after a deploy may send an event
// the server no longer knows. The good ones are kept; a batch without a good one is refused.
export function goodEvents(body: unknown): AnalyticsBatch | null {
  const envelope = envelopeSchema.safeParse(body);
  if (!envelope.success) return null;
  const events = envelope.data.events.flatMap((event) => {
    const parsed = analyticsEventSchema.safeParse(event);
    return parsed.success ? [parsed.data] : [];
  });
  return events.length > 0 ? { events } : null;
}
