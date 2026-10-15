import type { Rost, RostPeriod } from '@platform/contracts';
import { directionsOf, loopsOf } from '../domain/rost';
import { cached } from './read-stats';
import type { StatsDeps } from './ports';

const DAY = 24 * 60 * 60_000;
const PERIOD_DAYS: Readonly<Record<RostPeriod, number>> = { week: 7, month: 30 };

type EventsPart = Pick<Rost, 'events' | 'directions'> & { readonly came: Parameters<typeof loopsOf>[0] };

// The sessions and the searches need Analytics Engine; without it the people of D1 still show.
async function eventsPart(deps: StatsDeps, period: RostPeriod, at: number): Promise<EventsPart> {
  const { events } = deps;
  if (!events) return { events: 'off', came: [], directions: [] };
  const days = PERIOD_DAYS[period];
  try {
    const [came, searches] = await Promise.all([
      cached(deps.cache, `rost:marks:${period}`, at, () => events.marks(days)),
      cached(deps.cache, `rost:searches:${period}`, at, () => events.searches(days)),
    ]);
    return { events: 'on', came, directions: directionsOf(searches) };
  } catch {
    return { events: 'failed', came: [], directions: [] };
  }
}

// «Rost» of the team (G69, docs/123): what each loop of growth brought, and each direction.
export async function readRost(deps: StatsDeps, period: RostPeriod): Promise<Rost> {
  const at = deps.now();
  const since = at - PERIOD_DAYS[period] * DAY;
  const [arrivals, rode, part] = await Promise.all([
    cached(deps.cache, `rost:arrivals:${period}`, at, () => deps.numbers.arrivals(since)),
    cached(deps.cache, `rost:riders:${period}`, at, () => deps.numbers.riders(since)),
    eventsPart(deps, period, at),
  ]);
  return {
    period,
    events: part.events,
    loops: loopsOf(part.came, arrivals, rode),
    directions: part.directions,
    at,
  };
}
