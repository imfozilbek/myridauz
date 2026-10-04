import { describe, expect, it } from 'vitest';
import { answer, confirm } from './application/answer';
import { requestBooking } from './application/request';
import { tellTripRetimed } from './application/trip-change';
import { ALI, DILNOZA, DRIVER, OLIM, seats, setup } from './test-kit';

const value = <T>(result: { ok: true; value: T } | { ok: false; error: string }) => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('the driver moved the time (G39, docs/104, 8)', () => {
  it('tells the passengers with an open booking only, each once', async () => {
    const { deps, addTrip, bonus, notes } = setup();
    await bonus();
    const tripId = addTrip();
    const confirmed = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    await confirm(deps, DRIVER, confirmed.id);
    await requestBooking(deps, OLIM, tripId, seats(1));
    const declined = value(await requestBooking(deps, ALI, tripId, seats(1)));
    await answer(deps, DRIVER, declined.id, 'decline');
    notes.length = 0;
    await tellTripRetimed(deps, tripId);
    expect(notes).toEqual(['passenger: retimed Dilnoza', 'passenger: retimed Olim']);
  });
});
