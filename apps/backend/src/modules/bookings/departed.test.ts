import { describe, expect, it } from 'vitest';
import { requestBooking } from './application/request';
import { DILNOZA, HOUR, NOW, setup } from './test-kit';

describe('a trip that already left (docs/65 B8)', () => {
  it('takes no booking from an old link: the trip is on the road', async () => {
    const { deps, addTrip, setNow } = setup();
    const tripId = addTrip({ departAt: NOW + 2 * HOUR, endsAt: NOW + 9 * HOUR });
    setNow(NOW + 3 * HOUR);
    expect(await requestBooking(deps, DILNOZA, tripId, 1)).toEqual({ ok: false, error: 'bookings.departed' });
  });
});
