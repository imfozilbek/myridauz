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

export function createAnalyticsClient(options: AnalyticsClientOptions) {
  const { baseUrl, fetch, context, now = Date.now, schedule = scheduleWithTimer } = options;
  const url = new URL(ANALYTICS_PATH.slice(1), `${baseUrl.replace(/\/$/, '')}/`).toString();
  const queue: AnalyticsEvent[] = [];
  let cancelScheduled: (() => void) | undefined;
  // An API error is shown on the screen that was opened last (G12, docs/29).
  let lastScreen = FIRST_SCREEN;

  async function send(events: AnalyticsEvent[]): Promise<void> {
    const init = { method: 'POST', body: JSON.stringify({ events }), keepalive: true };
    // Analytics must never break the app: a lost batch is acceptable, a crash is not.
    await fetch(url, { ...init, headers: { 'content-type': 'application/json' } }).catch(() => undefined);
  }

  async function flush(): Promise<void> {
    cancelScheduled?.();
    cancelScheduled = undefined;
    while (queue.length > 0) await send(queue.splice(0, MAX_ANALYTICS_BATCH));
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
