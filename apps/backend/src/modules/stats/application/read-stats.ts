import { FUNNELS, type Funnel, type Stats, type StatsPeriod } from '@platform/contracts';
import { arrivalsOf } from '../domain/arrivals';
import { botLoadOf } from '../domain/bot-load';
import { FUNNEL_EVENTS, funnelOf } from '../domain/funnels';
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

type EventsPart = Pick<Stats, 'events' | 'funnels' | 'errors' | 'bots' | 'queueOps'>;
const NO_EVENTS = { funnels: [], errors: [], bots: [], queueOps: 0 };

// Funnels and errors need Analytics Engine; if it fails, the main numbers still show (docs/29).
async function eventsPart(deps: StatsDeps, period: StatsPeriod, at: number): Promise<EventsPart> {
  const { events } = deps;
  if (!events) return { events: 'off', ...NO_EVENTS };
  const days = PERIOD_DAYS[period];
  try {
    const [funnels, errors, bots] = await Promise.all([
      funnelsOf(deps, period),
      cached(deps.cache, `errors:${period}`, at, () => events.topErrors(days)),
      // The bots under load (G85 T1, docs/122).
      cached(deps.cache, `bots:${period}`, at, async () => botLoadOf(await events.bots(days), days)),
    ]);
    return { events: 'on', funnels, errors, ...bots };
  } catch {
    return { events: 'failed', ...NO_EVENTS };
  }
}

export async function readStats(deps: StatsDeps, period: StatsPeriod): Promise<Stats> {
  const at = deps.now();
  const since = at - PERIOD_DAYS[period] * DAY;
  // The main numbers count whole tables: they live in the cache too (G56, docs/117).
  const [numbers, arrivals, part] = await Promise.all([
    cached(deps.cache, `numbers:${period}`, at, () => deps.numbers.numbers(since)),
    cached(deps.cache, `arrivals:${period}`, at, () => deps.numbers.arrivals(since)),
    eventsPart(deps, period, at),
  ]);
  return { period, numbers, arrivals: arrivalsOf(arrivals), ...part, at };
}
