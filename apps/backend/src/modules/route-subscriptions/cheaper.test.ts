import { describe, expect, it } from 'vitest';
import { subscribe } from './application/manage';
import { matchCheaper, matchNew } from './application/notify';
import { ROUTE, setup, TRIP } from './test-kit';

describe('a trip of the route became cheaper (G39, docs/104, 9)', () => {
  it('tells every fitting subscription at once, even within the pause, and not the owner', async () => {
    const { deps, told } = setup();
    await subscribe(deps, 1, 'trips', ROUTE);
    await subscribe(deps, 9, 'trips', ROUTE);
    await subscribe(deps, 3, 'trips', { ...ROUTE, date: '2026-10-03' });
    await subscribe(deps, 4, 'requests', ROUTE);
    await matchNew(deps, 'trips', TRIP);
    await matchCheaper(deps, { ...TRIP, price: 80000 });
    expect(told).toEqual(['one 1 t1', 'cheaper 1 t1']);
  });
});
