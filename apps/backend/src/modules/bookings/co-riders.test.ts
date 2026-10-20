import { describe, expect, it } from 'vitest';
import { confirm } from './application/answer';
import { coRiders, rideTogether } from './application/co-riders';
import { requestBooking } from './application/request';
import { ALI, DILNOZA, DRIVER, OLIM, seats, setup } from './test-kit';

const value = <T>(result: { ok: true; value: T } | { ok: false; error: string }) => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('photos of passengers (docs/05)', () => {
  it('are seen by passengers with confirmed bookings on the same trip only, until it ends', async () => {
    const { deps, addTrip, bonus, arrive } = setup();
    await bonus();
    const tripId = addTrip();
    const first = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    const second = value(await requestBooking(deps, ALI, tripId, seats(1)));
    expect(await rideTogether(deps, DILNOZA, ALI)).toBe(false);
    await confirm(deps, DRIVER, first.id);
    await confirm(deps, DRIVER, second.id);
    expect(await rideTogether(deps, DILNOZA, ALI)).toBe(true);
    expect(await rideTogether(deps, DILNOZA, OLIM)).toBe(false);
    expect((await coRiders(deps, DILNOZA, first.id))?.[0]).toMatchObject({ hasAvatar: true });
    // G89 B7: after «Yetib keldik» names only, never faces.
    arrive(tripId);
    expect(await rideTogether(deps, DILNOZA, ALI)).toBe(false);
    expect((await coRiders(deps, DILNOZA, first.id))?.[0]).toMatchObject({ hasAvatar: false });
  });
});
