import { describe, expect, it } from 'vitest';
import { markProgress } from './application/progress';
import { ratableRideOf } from './application/rides';
import { booked, DEPART } from './test-booked';
import { DILNOZA, HOUR } from './test-kit';

describe('the stars right after «Yetib keldik» (docs/129, docs/124 В, G63)', () => {
  it('a ride is over once the driver arrived, before the trip closes by itself', async () => {
    const kit = await booked();
    kit.setNow(DEPART + HOUR);
    expect((await ratableRideOf(kit.deps, kit.id))?.over).toBe(false);
    kit.arrive((await kit.deps.bookings.find(kit.id))?.tripId ?? '');
    expect((await ratableRideOf(kit.deps, kit.id))?.over).toBe(true);
  });

  // G78 П6 (docs/170): the passenger's own «Yetib keldim» ends the ride for the stars at once.
  it('a ride is over for its passenger once she arrived, the driver still on the way', async () => {
    const kit = await booked();
    kit.setNow(DEPART + HOUR);
    expect((await markProgress(kit.deps, DILNOZA, kit.id, 'arrived')).ok).toBe(true);
    expect((await ratableRideOf(kit.deps, kit.id))?.over).toBe(true);
  });
});
