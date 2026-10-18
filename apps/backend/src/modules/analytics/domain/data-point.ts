import type { AnalyticsEvent } from '@platform/contracts';

// One Analytics Engine row. Index: the Mini App (sampling key). No personal data (docs/29).
export type DataPoint = {
  readonly indexes: [string];
  readonly blobs: string[];
  readonly doubles: number[];
};

export function toDataPoint(event: AnalyticsEvent, receivedAt: number): DataPoint {
  // The detail of an event: an error code, a funnel step or a search result (docs/29). A step of the
  // waitlist names its role too: «passenger.pains» (G83, docs/183); a reason of a cancel names what went:
  // «booking.plans» (G87 V3).
  const code =
    event.name === 'waitlist_step' && event.role
      ? `${event.role}.${event.step}`
      : event.name === 'cancel_reason'
        ? `${event.what}.${event.reason}`
        : 'button' in event
          ? [event.button, event.target].filter(Boolean).join('.')
          : 'source' in event && event.source
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
                          : 'state' in event
                            ? event.state
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
          : event.name === 'trip_search' && event.route
            ? [event.route] // G69: the direction of the search for «Rost» (docs/123)
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
// count: how many things one row stands for, the operations of the queue (G85 T1); it is double3.
export type ServerEvent = {
  readonly name: string;
  readonly source?: string;
  readonly code?: string;
  readonly count?: number;
};
export const serverDataPoint = (
  { name, source = 'server', code = '', count }: ServerEvent,
  at: number,
): DataPoint => ({
  indexes: ['server'],
  blobs: [name, source, '', '', '', code],
  doubles: count === undefined ? [at, at] : [at, at, count],
});
