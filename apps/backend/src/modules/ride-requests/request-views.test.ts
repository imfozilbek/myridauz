import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { requestBoard } from './application/board';
import { boardSeen } from './application/board-seen';
import { cancelRequest, myRequests, publishRequest } from './application/use-cases';
import { d1RequestViews } from './infrastructure/request-views';
import { setup } from './requests-test-kit';

const PASSENGER = 1;
const DRIVERS = [9, 10, 11];

// «14 haydovchi koʻrdi» of the passenger (G76, mockup g76/2 state 4): the different drivers who saw
// the request on «Yoʻlovchilar soʻrovlari», each once, only on the passenger's open request.
describe('the drivers who saw a request (G76)', () => {
  it('counts each driver of the board once, shows it only to the passenger and only while open', async () => {
    const kit = setup();
    const { request, directions } = kit;
    // Every driver of the test has the approved car of driver 9.
    const car = await kit.deps.approvedCar(9);
    const deps = { ...kit.deps, approvedCar: async () => car };
    directions([{ from: '1726', to: '1718' }]);
    const asked = await publishRequest(deps, PASSENGER, request);
    const id = asked.ok ? asked.value.id : '';
    for (const driver of [...DRIVERS, DRIVERS[0] ?? 0]) {
      const board = await requestBoard(deps, driver, { date: request.date });
      if (board.ok) await boardSeen(deps, driver, board.value);
      // Drivers never see the count of others.
      expect(board.ok && board.value.others.map((one) => one.views)).toEqual([0]);
    }
    expect((await myRequests(deps, PASSENGER)).find((one) => one.id === id)?.views).toBe(DRIVERS.length);
    await cancelRequest(deps, PASSENGER, id);
    expect((await myRequests(deps, PASSENGER)).find((one) => one.id === id)?.views).toBe(0);
  });

  it('keeps one row per driver and request in D1, reads by the key, forgets a deleted account', async () => {
    const db = testD1();
    const store = d1RequestViews(db);
    await store.record(['r1', 'r2'], 9, 1000);
    await store.record(['r1'], 9, 2000);
    await store.record(['r1'], 10, 3000);
    await store.record([], 11, 4000);
    expect(await store.counts(['r1', 'r2', 'r3'])).toEqual(
      new Map([
        ['r1', 2],
        ['r2', 1],
      ]),
    );
    expect(await store.counts([])).toEqual(new Map());
    await store.forget(9);
    expect(await store.counts(['r1', 'r2'])).toEqual(new Map([['r1', 1]]));
    expect(fullScans(db)).toEqual([]);
  });
});
