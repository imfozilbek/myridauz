import { describe, expect, it } from 'vitest';
import type { DataPoint } from '../analytics';
import { checkAlerts } from './application/check-alerts';
import type { EventSource, StatsDeps } from './application/ports';
import { readStats } from './application/read-stats';
import type { Alert } from './domain/alerts';
import { createMemoryCache } from './infrastructure/d1-cache';
import { memoryEvents } from './infrastructure/memory-events';

const NOW = 1_790_000_000_000;
const HOUR = 3_600_000;
const point = (
  name: string,
  app: string,
  session: string,
  code = '',
  ago = 0,
  screen = 'home',
): DataPoint => ({
  indexes: [app],
  blobs: [name, app, screen, '1', session, code],
  doubles: [NOW - ago, NOW - ago],
});
const numbers = { newUsers: 3, trips: 2, activeTrips: 4, bookings: 1, driverApplications: 1, complaints: 0 };

function setup(events: EventSource | null) {
  const told: Alert[] = [];
  let queries = 0;
  const counting: EventSource | null = events && {
    counters: (days, names) => ((queries += 1), events.counters(days, names)),
    topErrors: (days) => ((queries += 1), events.topErrors(days)),
    errorsSince: (hours) => ((queries += 1), events.errorsSince(hours)),
  };
  const deps: StatsDeps = {
    events: counting,
    numbers: { numbers: async () => numbers },
    cache: createMemoryCache(),
    rules: { errorGrowth: 3, minErrors: 2, dropGrowth: 20, minPeople: 2, repeatHours: 6 },
    tellTeam: async (alert) => void told.push(alert),
    now: () => NOW,
  };
  return { deps, told, queries: () => queries };
}

const rows = [
  point('screen_open', 'passenger', 's1'),
  point('screen_open', 'passenger', 's1'),
  point('screen_open', 'passenger', 's2'),
  point('trip_search', 'passenger', 's1', 'found'),
  point('client_error', 'passenger', 's2', 'render', 0, 'market.results'),
  point('api_error', 'driver', 's3', 'trips.too_many', 0, 'market.review'),
  point('api_error', 'driver', 's3', 'trips.too_many', 0, 'market.review'),
  point('screen_open', 'passenger', 'old', '', 3 * 24 * HOUR),
];

describe('readStats (docs/29)', () => {
  it('shows the numbers, the funnels by people and the top errors; a second look is cached', async () => {
    const { deps, queries } = setup(memoryEvents(rows, () => NOW));
    const day = await readStats(deps, 'day');
    expect(day.numbers).toEqual(numbers);
    expect(day.events).toBe('on');
    expect(day.funnels.find((funnel) => funnel.id === 'passenger')?.steps.slice(0, 2)).toEqual([
      { step: 'opened', count: 2, drop: null },
      { step: 'searched', count: 1, drop: 50 },
    ]);
    expect(day.errors).toEqual([
      { app: 'driver', screen: 'market.review', code: 'trips.too_many', count: 2 },
      { app: 'passenger', screen: 'market.results', code: 'render', count: 1 },
    ]);
    expect((await readStats(deps, 'week')).funnels[0]?.steps[0]?.count).toBe(3);
    const before = queries();
    await readStats(deps, 'day');
    expect(queries()).toBe(before);
  });

  it('still shows the numbers without the analytics key or when Analytics Engine fails', async () => {
    expect(await readStats(setup(null).deps, 'day')).toMatchObject({ events: 'off', funnels: [], numbers });
    const broken: EventSource = {
      counters: () => Promise.reject(new Error('stats.sql_500')),
      topErrors: async () => [],
      errorsSince: async () => 0,
    };
    expect(await readStats(setup(broken).deps, 'day')).toMatchObject({
      events: 'failed',
      errors: [],
      numbers,
    });
  });
});

describe('checkAlerts (docs/29)', () => {
  it('tells the team once about a jump of errors, again only after the repeat hours', async () => {
    const { deps, told } = setup(memoryEvents(rows, () => NOW));
    expect(await checkAlerts(deps)).toBe(1);
    expect(told).toEqual([{ key: 'errors', kind: 'errors', hour: 3, usual: 0 }]);
    expect(await checkAlerts(deps)).toBe(0);
    expect(await checkAlerts(setup(null).deps)).toBe(0);
  });
});
