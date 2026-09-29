import type { ErrorRow, MainNumber } from '@platform/contracts';
import type { Alert, AlertRules } from '../domain/alerts';
import type { Counter } from '../domain/counters';

// Errors of the Mini Apps (docs/29): a crash of a screen and an error answer of the API.
export const ERROR_EVENTS = ['client_error', 'api_error'] as const;

// The events of Analytics Engine (docs/29); null while the analytics key is not set (docs/46).
export type EventSource = {
  counters(days: number, names: readonly string[]): Promise<Counter[]>;
  topErrors(days: number): Promise<ErrorRow[]>;
  errorsSince(hours: number): Promise<number>;
};

// The main numbers come from the database: exact, no sampling.
export type NumbersSource = { numbers(since: number): Promise<Record<MainNumber, number>> };

// Saved answers: Analytics Engine allows 10 000 queries a day (docs/03). Also remembers sent signals.
export type StatsCache = {
  get(key: string, now: number): Promise<string | undefined>;
  put(key: string, body: string, until: number): Promise<void>;
};

export type StatsDeps = {
  readonly events: EventSource | null;
  readonly numbers: NumbersSource;
  readonly cache: StatsCache;
  readonly rules: AlertRules;
  readonly tellTeam: (alert: Alert) => Promise<void>;
  readonly now: () => number;
};
