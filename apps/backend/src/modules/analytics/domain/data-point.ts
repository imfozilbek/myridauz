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
    'source' in event && event.source
      ? event.source
      : 'code' in event
        ? event.code
        : 'step' in event
          ? event.step
          : 'result' in event
            ? event.result
            : 'method' in event
              ? event.method
              : 'length' in event
                ? String(event.length)
                : 'navigator' in event
                  ? event.navigator
                  : 'target' in event
                    ? event.target
                    : '';
  // What broke a screen follows its code (G52, docs/112). The first screen of a session keeps the
  // platform in the same place and the mark of the source after it (G55, docs/116); so does the ready app.
  const crash =
    event.name === 'client_error'
      ? [event.error ?? '', event.detail ?? '', event.client ?? '', event.where ?? '']
      : event.name === 'screen_open' && (event.client || event.via)
        ? ['', '', event.client ?? '', '', event.via ?? '']
        : event.name === 'app_ready'
          ? ['', '', event.client ?? '']
          : [];
  // The time of the first screen is a number of its own (G72, docs/121 §4).
  const ready = event.name === 'app_ready' ? [event.ms] : [];
  return {
    indexes: [event.app],
    blobs: [event.name, event.app, event.screen, event.version, event.sessionId, code, ...crash],
    doubles: [event.at, receivedAt, ...ready],
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
