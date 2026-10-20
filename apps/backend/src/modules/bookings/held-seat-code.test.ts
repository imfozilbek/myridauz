import { describe, expect, it } from 'vitest';
import { confirm } from './application/answer';
import { requestBooking } from './application/request';
import { DRIVER, OLIM, seats, setup } from './test-kit';

// G89 B19 (owner text 20.10.2026): one seat at a time (docs/172). A passenger whose seat waits hears
// «wait for the drivers»; a passenger with a confirmed seat hears she has a seat on another trip.
describe('a second seat while one is held', () => {
  it('names the held seat: waiting or confirmed', async () => {
    const { deps, addTrip, bonus } = setup();
    await bonus();
    const asked = await requestBooking(deps, OLIM, addTrip(), seats(1));
    if (!asked.ok) throw new Error(asked.error);
    expect(await requestBooking(deps, OLIM, addTrip(), seats(1))).toEqual({
      ok: false,
      error: 'bookings.too_many',
    });
    expect((await confirm(deps, DRIVER, asked.value.id)).ok).toBe(true);
    expect(await requestBooking(deps, OLIM, addTrip(), seats(1))).toEqual({
      ok: false,
      error: 'bookings.has_seat',
    });
  });
});
