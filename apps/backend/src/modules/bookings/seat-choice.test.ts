import { describe, expect, it } from 'vitest';
import { requestBooking } from './application/request';
import { DILNOZA, OLIM, seats, setup } from './test-kit';

describe('the choice of the booking reaches the booking (G59)', () => {
  it('a man keeps «Men bilan ayol bor» with 2 seats, a woman never needs it', async () => {
    const { deps, addTrip } = setup();
    const tripId = addTrip();
    const man = await requestBooking(deps, OLIM, tripId, seats(2, { withWoman: true }));
    expect(man.ok && man.value).toMatchObject({ withWoman: true, wholeCar: false });
    const woman = await requestBooking(deps, DILNOZA, addTrip(), seats(2, { withWoman: true }));
    expect(woman.ok && woman.value.withWoman).toBe(false);
  });

  it('a trip of seats takes no whole car', async () => {
    const { deps, addTrip } = setup();
    expect(await requestBooking(deps, OLIM, addTrip(), seats(3, { wholeCar: true }))).toEqual({
      ok: false,
      error: 'bookings.invalid_input',
    });
  });
});
