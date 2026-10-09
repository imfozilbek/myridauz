import type { Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { expireRequests } from './application/expire';
import { requestBooking } from './application/request';
import { ALI, DILNOZA, NOW, seats, setup } from './test-kit';

const HOUR = 60 * 60 * 1000;

// A message that did not go out does not leave the others untold, and comes again at the next run
// of the Cron (G42, docs/111, docs/80 S22).
describe('the expiry of requests without an answer', () => {
  it('tells every passenger, and tells the one that failed at the next run', async () => {
    const { deps, addTrip, bonus } = setup();
    await bonus();
    const first = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    await requestBooking(deps, ALI, addTrip(), seats(1));
    let failing = first.ok ? first.value.passenger.firstName : '';
    const told: string[] = [];
    const expired = async (booking: Booking) => {
      if (booking.passenger.firstName === failing) throw new Error('queue is down');
      told.push(booking.passenger.firstName);
    };
    const cron = { ...deps, notify: { ...deps.notify, expired } };
    // Asked at 06:00: 24 hours end at night, so the answer waits till 08:00 (docs/127).
    await expireRequests(cron, NOW + 27 * HOUR);
    expect(told).toEqual(['Ali']);
    failing = '';
    await expireRequests(cron, NOW + 28 * HOUR);
    expect(told).toEqual(['Ali', 'Dilnoza']);
    await expireRequests(cron, NOW + 29 * HOUR);
    expect(told).toEqual(['Ali', 'Dilnoza']);
  });
});
