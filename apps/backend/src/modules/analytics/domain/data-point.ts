import type { AnalyticsEvent } from '@platform/contracts';

// One Analytics Engine row. Index: the Mini App (sampling key). No personal data (docs/29).
export type DataPoint = {
  readonly indexes: [string];
  readonly blobs: string[];
  readonly doubles: number[];
};

export function toDataPoint(event: AnalyticsEvent, receivedAt: number): DataPoint {
  const code = event.name === 'client_error' ? event.code : '';
  return {
    indexes: [event.app],
    blobs: [event.name, event.app, event.screen, event.version, event.sessionId, code],
    doubles: [event.at, receivedAt],
  };
}
