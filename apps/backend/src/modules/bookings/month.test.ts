import { describe, expect, it } from 'vitest';
import { confirm } from './application/answer';
import { driverMonth } from './application/month';
import { requestBooking } from './application/request';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, seats, setup } from './test-kit';

// «Bu oy N safar», «Yoʻl xarajati qaytdi» (G64, docs/118 path 7): the trips of this month in Tashkent
// that left, and what the passengers on them paid for their seats.
describe('the month of a driver (G64)', () => {
  it('counts the trips that left this month and the costs of the passengers who rode', async () => {
    const { deps, addTrip, bonus, setNow } = setup();
    await bonus();
    const done = addTrip({ departAt: NOW + 2 * HOUR, price: 90_000 });
    const two = await requestBooking(deps, DILNOZA, done, seats(2));
    await confirm(deps, DRIVER, two.ok ? two.value.id : '');
    const one = await requestBooking(deps, ALI, done, seats(1));
    await confirm(deps, DRIVER, one.ok ? one.value.id : '');
    // Waits for an answer: no seat paid.
    addTrip({ departAt: NOW + 3 * HOUR });
    // Ahead: not on the road yet.
    addTrip({ departAt: NOW + 50 * HOUR });
    // Last month: 2026-09-30.
    addTrip({ departAt: NOW - 10 * HOUR });
    addTrip({ departAt: NOW + 2 * HOUR, driverId: ALI });
    setNow(NOW + 5 * HOUR);
    expect(await driverMonth(deps, DRIVER)).toEqual({ trips: 2, costs: 270_000 });
  });
});
