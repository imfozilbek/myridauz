import { DAY_MS, type SubscriptionInput } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { placeMatches } from '../../shared/places/place-match';
import { mySubscriptions, renew, subscribe, unsubscribe } from './application/manage';
import { matchNew, sendWaiting } from './application/notify';
import type { SubscriptionsDeps } from './application/ports';
import type { Match } from './domain/subscription';
import { createMemorySubscriptions } from './infrastructure/subscription-store';

const MINUTE = 60 * 1000;
// 2026-10-01 06:00 in Tashkent.
const NOW = Date.parse('2026-10-01T01:00:00Z');
const PLACES = new Map(
  [
    { id: '1726', parentId: null, oneCity: true },
    { id: '1726269', parentId: '1726', oneCity: false },
    { id: '1726294', parentId: '1726', oneCity: false },
    { id: '1718', parentId: null, oneCity: false },
    { id: '1718401', parentId: '1718', oneCity: false },
    { id: '1718233', parentId: '1718', oneCity: false },
  ].map((place) => [place.id, place]),
);
const ROUTE: SubscriptionInput = { from: '1726269', to: '1718', date: '2026-10-02', woman: false };
const TRIP: Match = {
  id: 't1',
  ownerId: 9,
  from: '1726294',
  to: '1718401',
  date: '2026-10-02',
  woman: false,
  time: '08:30',
  seats: 3,
  price: 85000,
};

function setup() {
  let now = NOW;
  let id = 0;
  const told: string[] = [];
  const deps: SubscriptionsDeps = {
    subscriptions: createMemorySubscriptions(),
    placeMatches: async () => (placeId, searchId) => placeMatches(placeId, searchId, PLACES),
    tell: {
      one: async (s, match) => void told.push(`one ${s.userId} ${match.id}`),
      many: async (s, count) => void told.push(`many ${s.userId} ${count}`),
      renew: async (s) => void told.push(`renew ${s.userId}`),
    },
    newId: () => `s${(id += 1)}`,
    now: () => now,
  };
  return { deps, told, pass: (ms: number) => void (now += ms) };
}

describe('subscribing to a route (docs/24)', () => {
  it('keeps at most 5 live subscriptions, the same route once', async () => {
    const { deps } = setup();
    const first = await subscribe(deps, 1, 'trips', ROUTE);
    expect(await subscribe(deps, 1, 'trips', ROUTE)).toEqual(first);
    for (const day of ['03', '04', '05', '06'])
      await subscribe(deps, 1, 'trips', { ...ROUTE, date: `2026-10-${day}` });
    expect(await subscribe(deps, 1, 'trips', { ...ROUTE, date: null })).toEqual({
      ok: false,
      error: 'subscriptions.too_many',
    });
    expect(await subscribe(deps, 1, 'requests', ROUTE)).toMatchObject({ ok: true });
    expect(await mySubscriptions(deps, 1, 'trips')).toHaveLength(5);
    expect(await unsubscribe(deps, 2, 'trips', 's1')).toBe(false);
    expect(await unsubscribe(deps, 1, 'trips', 's1')).toBe(true);
  });

  it('asks for "ayol bor" only from passengers', async () => {
    const { deps } = setup();
    expect(await subscribe(deps, 1, 'requests', { ...ROUTE, woman: true })).toMatchObject({
      value: { woman: false },
    });
  });
});

describe('telling about new trips and requests (docs/24)', () => {
  it('matches the route (a region stands for its places), the day, "ayol bor" and not one own trip', async () => {
    const { deps, told } = setup();
    await subscribe(deps, 1, 'trips', ROUTE);
    await subscribe(deps, 2, 'trips', { ...ROUTE, woman: true });
    await subscribe(deps, 9, 'trips', ROUTE);
    await subscribe(deps, 3, 'trips', { ...ROUTE, date: '2026-10-03' });
    await subscribe(deps, 4, 'requests', ROUTE);
    await matchNew(deps, 'trips', TRIP);
    expect(told).toEqual(['one 1 t1']);
    await matchNew(deps, 'trips', { ...TRIP, id: 't2', woman: true, to: '1726294' });
    expect(told).toEqual(['one 1 t1']);
  });

  it('sends one message per 10 minutes, the rest together after the pause', async () => {
    const { deps, told, pass } = setup();
    await subscribe(deps, 1, 'trips', { ...ROUTE, date: null });
    await matchNew(deps, 'trips', TRIP);
    await matchNew(deps, 'trips', { ...TRIP, id: 't2' });
    await matchNew(deps, 'trips', { ...TRIP, id: 't3' });
    await sendWaiting(deps);
    expect(told).toEqual(['one 1 t1']);
    pass(10 * MINUTE);
    await sendWaiting(deps);
    expect(told).toEqual(['one 1 t1', 'many 1 2']);
    await sendWaiting(deps);
    expect(told).toHaveLength(2);
  });

  it('drops a dated subscription after its day and offers to renew "any date" after 30 days', async () => {
    const { deps, told, pass } = setup();
    await subscribe(deps, 1, 'trips', ROUTE);
    await subscribe(deps, 2, 'trips', { ...ROUTE, date: null });
    pass(2 * DAY_MS);
    await sendWaiting(deps);
    expect(await mySubscriptions(deps, 1, 'trips')).toEqual([]);
    expect(told).toEqual([]);
    pass(29 * DAY_MS);
    await sendWaiting(deps);
    await sendWaiting(deps);
    expect(told).toEqual(['renew 2']);
    const [over] = await mySubscriptions(deps, 2, 'trips');
    expect(over?.expired).toBe(true);
    await matchNew(deps, 'trips', { ...TRIP, date: '2026-11-05' });
    expect(told).toEqual(['renew 2']);
    expect(await renew(deps, 2, 'trips', over?.id ?? '')).toMatchObject({
      ok: true,
      value: { expired: false },
    });
    await matchNew(deps, 'trips', { ...TRIP, date: '2026-11-05' });
    expect(told).toEqual(['renew 2', 'one 2 t1']);
    expect(await renew(deps, 1, 'trips', over?.id ?? '')).toEqual({
      ok: false,
      error: 'subscriptions.not_found',
    });
  });

  it('puts the live subscriptions above the stopped ones (G41, docs/90 F-P15)', async () => {
    const { deps, pass } = setup();
    const older = await subscribe(deps, 1, 'trips', { ...ROUTE, date: null });
    pass(DAY_MS);
    await subscribe(deps, 1, 'trips', { ...ROUTE, to: '1718233', date: null });
    pass(30 * DAY_MS);
    await renew(deps, 1, 'trips', older.ok ? older.value.id : '');
    // The renewed older one is live, the newer one stopped after its 30 days.
    const order = (await mySubscriptions(deps, 1, 'trips')).map((item) => item.to);
    expect(order).toEqual(['1718', '1718233']);
  });
});
