import { describe, expect, it } from 'vitest';
import { ratableRideOf } from './application/rides';
import { booked, DEPART } from './test-booked';
import { HOUR } from './test-kit';

describe('the stars right after «Yetib keldik» (docs/129, docs/124 В, G63)', () => {
  it('a ride is over once the driver arrived, before the trip closes by itself', async () => {
    const kit = await booked();
    kit.setNow(DEPART + HOUR);
    expect((await ratableRideOf(kit.deps, kit.id))?.over).toBe(false);
    kit.arrive((await kit.deps.bookings.find(kit.id))?.tripId ?? '');
    expect((await ratableRideOf(kit.deps, kit.id))?.over).toBe(true);
  });
});
