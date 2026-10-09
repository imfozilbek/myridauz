import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { mySubscriptions, renew, subscribe, unsubscribe } from './application/manage';
import { endOverdue, matchNew } from './application/notify';
import { ROUTE, setup, TRIP } from './test-kit';

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

  it('tells every match at once: the news card of the day takes them all (docs/122 rule 4)', async () => {
    const { deps, told } = setup();
    await subscribe(deps, 1, 'trips', { ...ROUTE, date: null });
    await matchNew(deps, 'trips', TRIP);
    await matchNew(deps, 'trips', { ...TRIP, id: 't2' });
    expect(told).toEqual(['one 1 t1', 'one 1 t2']);
  });

  it('drops a dated subscription after its day and offers to renew "any date" after 30 days', async () => {
    const { deps, told, pass } = setup();
    await subscribe(deps, 1, 'trips', ROUTE);
    await subscribe(deps, 2, 'trips', { ...ROUTE, date: null });
    pass(2 * DAY_MS);
    await endOverdue(deps);
    expect(await mySubscriptions(deps, 1, 'trips')).toEqual([]);
    expect(told).toEqual([]);
    pass(29 * DAY_MS);
    await endOverdue(deps);
    await endOverdue(deps);
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
