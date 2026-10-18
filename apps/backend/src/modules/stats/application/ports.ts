import type { ErrorRow, MainNumber } from '@platform/contracts';
import type { Alert, AlertRules } from '../domain/alerts';
import type { ArrivalCount } from '../domain/arrivals';
import type { BotEvents } from '../domain/bot-load';
import type { FeelingRows } from '../domain/feelings';
import type { Counter } from '../domain/counters';
import type { MarkCount, SearchCount } from '../domain/rost';

// Errors (docs/29): a crash of a screen, a failure of the server (G42) and an error answer of the API.
export const ERROR_EVENTS = ['client_error', 'server_error', 'api_error'] as const;

// The events of Analytics Engine (docs/29); null while the analytics key is not set (docs/46).
export type EventSource = {
  counters(days: number, names: readonly string[]): Promise<Counter[]>;
  topErrors(days: number): Promise<ErrorRow[]>;
  errorsSince(hours: number): Promise<number>;
  // «Rost» (G69, docs/123): the sessions that came with a mark, and the searches by direction.
  marks(days: number): Promise<MarkCount[]>;
  searches(days: number): Promise<SearchCount[]>;
  // The bots under load (G85 T1): their answers from Telegram, the queue, the busiest seconds.
  bots(days: number): Promise<BotEvents>;
};

// The main numbers come from the database: exact, no sampling.
// The new people by the mark of their source and their platform (G55, docs/116).
export type NumbersSource = {
  numbers(since: number): Promise<Record<MainNumber, number>>;
  arrivals(since: number): Promise<ArrivalCount[]>;
  // The new people of a mark who rode since (G69): a seat ridden or a trip driven to its end.
  riders(since: number): Promise<MarkCount[]>;
  // The reviews and complaints since a moment (G87 V2).
  feelings(since: number): Promise<FeelingRows>;
};

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
  // A sign in «Diqqat» of the owner (G68, docs/122).
  readonly tellOwners: (alert: Alert) => Promise<void>;
  readonly now: () => number;
};
