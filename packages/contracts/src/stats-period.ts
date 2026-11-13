import { DAY_MS } from './tashkent-time';

// The periods of the dashboard of the team (docs/29); all: the whole time (owner decision 13.11.2026);
// month: 30 days (G99, docs/234).
export const STATS_PERIODS = ['day', 'week', 'month', 'all'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];
// Analytics Engine keeps the events 3 months, so the funnels of «Hammasi» are of the last 90 days.
export const EVENTS_DAYS = 90;
const PERIOD_DAYS: Readonly<Record<StatsPeriod, number>> = { day: 1, week: 7, month: 30, all: EVENTS_DAYS };
// The days of the events of a period; the start of the database counts: 0 for the whole time.
export const eventDaysOf = (period: StatsPeriod): number => PERIOD_DAYS[period];
export const periodSince = (period: StatsPeriod, now: number): number =>
  period === 'all' ? 0 : now - PERIOD_DAYS[period] * DAY_MS;
