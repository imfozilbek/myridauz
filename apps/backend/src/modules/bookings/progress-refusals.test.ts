import { describe, expect, it } from 'vitest';
import { markProgress, passengerView } from './application/progress';
import { requestBooking } from './application/request';
import { booked, MEETING } from './test-booked';
import { ALI, DILNOZA, seats, setup } from './test-kit';

const refused = (error: string) => ({ ok: false, error });

// G89: «Men keldim» and «Yetib keldim» only on one's own confirmed seat of a trip that is there; a
// cancel of the driver in the same moment wins, the passenger reads it.
describe('the steps of a passenger refused', () => {
  it('takes no step on a seat of nobody, of another person or not confirmed', async () => {
    const { deps, id, setNow } = await booked();
    setNow(MEETING);
    expect(await markProgress(deps, DILNOZA, 'none', 'came')).toEqual(refused('bookings.not_found'));
    expect(await markProgress(deps, ALI, id, 'came')).toEqual(refused('bookings.not_found'));
    const kit = setup();
    const asked = await requestBooking(kit.deps, DILNOZA, kit.addTrip(), seats(1));
    const askedId = asked.ok ? asked.value.id : '';
    expect(await markProgress(kit.deps, DILNOZA, askedId, 'came')).toEqual(refused('bookings.wrong_status'));
  });

  it('takes no step when the trip is gone', async () => {
    const { deps, id, setNow } = await booked();
    setNow(MEETING);
    const gone = { ...deps, trips: { ...deps.trips, find: async () => undefined } };
    expect(await markProgress(gone, DILNOZA, id, 'came')).toEqual(refused('bookings.not_found'));
  });

  it('says the seat changed when a cancel came first', async () => {
    const { deps, id, setNow } = await booked();
    setNow(MEETING);
    let reads = 0;
    const find = async (bookingId: string) => {
      const record = await deps.bookings.find(bookingId);
      reads += 1;
      return reads > 1 && record ? { ...record, status: 'cancelled_by_driver' as const } : record;
    };
    const racing = { ...deps, bookings: { ...deps.bookings, find } };
    expect(await markProgress(racing, DILNOZA, id, 'came')).toEqual(refused('bookings.wrong_status'));
  });

  it('shares no booking that is not there', async () => {
    const { deps } = setup();
    expect(await passengerView(deps, 'none')).toBeUndefined();
  });
});
