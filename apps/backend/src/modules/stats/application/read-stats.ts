import { FUNNELS, type Funnel, type Stats, type StatsPeriod } from '@platform/contracts';
import { arrivalsOf } from '../domain/arrivals';
import { botBlocksOf, botLoadOf } from '../domain/bot-load';
import { FUNNEL_EVENTS, funnelOf } from '../domain/funnels';
import {
  complaintReasonCountsOf,
  FIRST_SCREEN,
  LEAVE_EVENT,
  leavingOf,
  opensOf,
  ratingsSummaryOf,
} from '../domain/voice';
import type { StatsCache, StatsDeps } from './ports';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// A dashboard answer lives 10 minutes: at most 6 queries an hour per period (docs/29).
const CACHE_MINUTES = 10;
const PERIOD_DAYS: Readonly<Record<StatsPeriod, number>> = { day: 1, week: 7 };

export async function cached<T>(
  cache: StatsCache,
  key: string,
  now: number,
  load: () => Promise<T>,
): Promise<T> {
  const saved = await cache.get(key, now);
  if (saved !== undefined) return JSON.parse(saved) as T;
  const fresh = await load();
  await cache.put(key, JSON.stringify(fresh), now + CACHE_MINUTES * MINUTE);
  return fresh;
}

export const funnelsOf = (deps: StatsDeps, period: StatsPeriod): Promise<Funnel[]> =>
  cached(deps.cache, `funnels:${period}`, deps.now(), async () => {
    const counters = (await deps.events?.counters(PERIOD_DAYS[period], FUNNEL_EVENTS)) ?? [];
    return FUNNELS.map((id) => funnelOf(id, counters));
  });

type EventsPart = Pick<
  Stats,
  'events' | 'funnels' | 'errors' | 'bots' | 'queueOps' | 'blocks' | 'leaving' | 'opens'
>;
const NO_EVENTS = { funnels: [], errors: [], bots: [], queueOps: 0, blocks: [], leaving: [], opens: [] };
// G87 (docs/191): the reasons of leaving and the first screens of the sessions, in one query.
const FEEL_EVENTS = [LEAVE_EVENT, FIRST_SCREEN];

// Funnels and errors need Analytics Engine; if it fails, the main numbers still show (docs/29).
async function eventsPart(deps: StatsDeps, period: StatsPeriod, at: number): Promise<EventsPart> {
  const { events } = deps;
  if (!events) return { events: 'off', ...NO_EVENTS };
  const days = PERIOD_DAYS[period];
  try {
    const [funnels, errors, bots, feel] = await Promise.all([
      funnelsOf(deps, period),
      cached(deps.cache, `errors:${period}`, at, () => events.topErrors(days)),
      // The bots under load (G85 T1, docs/122).
      // G87: the people who blocked the bots come in the same answer of Analytics Engine.
      cached(deps.cache, `bots:${period}`, at, async () => {
        const found = await events.bots(days);
        return { ...botLoadOf(found, days), blocks: botBlocksOf(found.rows) };
      }),
      cached(deps.cache, `feel:${period}`, at, async () => {
        const counters = await events.counters(days, FEEL_EVENTS);
        return { leaving: leavingOf(counters), opens: opensOf(counters) };
      }),
    ]);
    return { events: 'on', funnels, errors, ...bots, ...feel };
  } catch {
    return { events: 'failed', ...NO_EVENTS };
  }
}

export async function readStats(deps: StatsDeps, period: StatsPeriod): Promise<Stats> {
  const at = deps.now();
  const span = PERIOD_DAYS[period] * DAY;
  const since = at - span;
  // The main numbers count whole tables: they live in the cache too (G56, docs/117).
  const [numbers, before, arrivals, voice, part] = await Promise.all([
    cached(deps.cache, `numbers:${period}`, at, () => deps.numbers.numbers(since)),
    // The period before, to compare (G45, F-A12 of docs/90).
    cached(deps.cache, `before:${period}`, at, () => deps.numbers.before(since - span, since)),
    cached(deps.cache, `arrivals:${period}`, at, () => deps.numbers.arrivals(since)),
    // G87 (docs/191): the ratings and the complaints of the period.
    cached(deps.cache, `voice:${period}`, at, async () => {
      const rows = await deps.numbers.voice(since);
      return { ratings: ratingsSummaryOf(rows), complaintReasons: complaintReasonCountsOf(rows) };
    }),
    eventsPart(deps, period, at),
  ]);
  return { period, numbers, before, arrivals: arrivalsOf(arrivals), ...voice, ...part, at };
}
