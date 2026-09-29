import type { AnalyticsEvent } from '@platform/contracts';

// One Analytics Engine row. Index: the Mini App (sampling key). No personal data (docs/29).
export type DataPoint = {
  readonly indexes: [string];
  readonly blobs: string[];
  readonly doubles: number[];
};

export function toDataPoint(event: AnalyticsEvent, receivedAt: number): DataPoint {
  // The detail of an event: an error code, a funnel step or a search result (docs/29).
  const code =
    'code' in event ? event.code : 'step' in event ? event.step : 'result' in event ? event.result : '';
  return {
    indexes: [event.app],
    blobs: [event.name, event.app, event.screen, event.version, event.sessionId, code],
    doubles: [event.at, receivedAt],
  };
}

// An event of the backend itself: no Mini App, no session. A bot event names its bot and an id (G12).
export type ServerEvent = { readonly name: string; readonly source?: string; readonly code?: string };
export const serverDataPoint = (
  { name, source = 'server', code = '' }: ServerEvent,
  at: number,
): DataPoint => ({
  indexes: ['server'],
  blobs: [name, source, '', '', '', code],
  doubles: [at, at],
});
