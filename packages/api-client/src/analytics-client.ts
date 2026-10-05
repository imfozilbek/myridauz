import { ANALYTICS_PATH, MAX_ANALYTICS_BATCH, type AnalyticsEvent } from '@platform/contracts';
import type { Fetch } from './fetch';

type Context = Pick<AnalyticsEvent, 'app' | 'sessionId' | 'version'>;
type Stamped = keyof Context | 'at';
export type AnalyticsInput = AnalyticsEvent extends infer E
  ? E extends AnalyticsEvent
    ? Omit<E, Stamped>
    : never
  : never;
type Schedule = (task: () => void, delayMs: number) => () => void;

// Events go in batches to save requests and the daily limit (docs/29).
const FLUSH_DELAY_MS = 5000;
// Without network the events wait on the phone (G43); the oldest go first past this many.
const MAX_KEPT = 4 * MAX_ANALYTICS_BATCH;
const FIRST_SCREEN = 'app';
const scheduleWithTimer: Schedule = (task, delayMs) => {
  const timer = setTimeout(task, delayMs);
  return () => clearTimeout(timer);
};

type AnalyticsClientOptions = {
  readonly baseUrl: string;
  readonly fetch: Fetch;
  readonly context: Context;
  readonly now?: () => number;
  readonly schedule?: Schedule;
};

const SIMPLE_TYPE = 'text/plain;charset=UTF-8';

export function createAnalyticsClient(options: AnalyticsClientOptions) {
  const { baseUrl, fetch, context, now = Date.now, schedule = scheduleWithTimer } = options;
  const url = new URL(ANALYTICS_PATH.slice(1), `${baseUrl.replace(/\/$/, '')}/`).toString();
  const queue: AnalyticsEvent[] = [];
  let cancelScheduled: (() => void) | undefined;
  // An API error is shown on the screen that was opened last (G12, docs/29).
  let lastScreen = FIRST_SCREEN;

  // Plain text is a simple request: the browser sends no preflight, one request to the Worker, not
  // two (G56, docs/117). The server reads the JSON all the same. Analytics never breaks the app.
  async function send(events: AnalyticsEvent[]): Promise<boolean> {
    const init = { method: 'POST', body: JSON.stringify({ events }), keepalive: true };
    const headers = { 'content-type': SIMPLE_TYPE };
    return fetch(url, { ...init, headers }).then(
      () => true,
      () => false,
    );
  }

  async function flush(): Promise<void> {
    cancelScheduled?.();
    cancelScheduled = undefined;
    while (queue.length > 0) {
      const events = queue.splice(0, MAX_ANALYTICS_BATCH);
      if (await send(events)) continue;
      queue.unshift(...events);
      queue.splice(0, Math.max(0, queue.length - MAX_KEPT));
      cancelScheduled = schedule(() => void flush(), FLUSH_DELAY_MS);
      return;
    }
  }

  function track(input: AnalyticsInput): void {
    lastScreen = input.screen;
    queue.push({ ...input, ...context, at: now() } as AnalyticsEvent);
    if (queue.length >= MAX_ANALYTICS_BATCH) void flush();
    else cancelScheduled ??= schedule(() => void flush(), FLUSH_DELAY_MS);
  }

  const apiError = (code: string) => track({ name: 'api_error', screen: lastScreen, code });

  return { track, flush, apiError };
}

export type AnalyticsClient = ReturnType<typeof createAnalyticsClient>;
