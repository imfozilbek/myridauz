import { describe, expect, it } from 'vitest';
import { balanceOf } from '../wallet/domain/ledger';
import { confirm } from './application/answer';
import { cancelEverything } from './application/cancel-all';
import { markMeeting } from './application/meeting';
import { markProgress } from './application/progress';
import { cancelByPassenger, requestBooking } from './application/request';
import { settleBookings } from './application/settle';
import { cancelTripByTeam } from './application/team-cancel';
import { booked, DEPART, MEETING } from './test-booked';
import { DILNOZA, DRIVER, HOUR, seats, setup } from './test-kit';

const idOf = (result: { ok: boolean; value?: { id: string } }) =>
  result.ok && result.value ? result.value.id : '';

// G89: no seat stays alive on a trip that was cancelled, and no commission on a seat that ended.
describe('a seat ends with its trip (docs/35, G89)', () => {
  it('tells a waiting passenger the team cancelled the trip, not that the driver said no (T5)', async () => {
    const { deps, addTrip, bonus, notes } = setup();
    await bonus();
    const tripId = addTrip();
    const asked = idOf(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    await cancelTripByTeam(deps, tripId, 'Yoʻl yopiq');
    expect((await deps.bookings.find(asked))?.status).toBe('cancelled_by_driver');
    expect(notes).toContain('cancelled by team');
    expect(notes).not.toContain('passenger: declined');
  });

  it('keeps a trip whose meeting began when its driver is blocked (T4, docs/17)', async () => {
    const kit = await booked();
    kit.setNow(MEETING);
    expect((await markMeeting(kit.deps, DRIVER, kit.id, 'met')).ok).toBe(true);
    await cancelEverything(kit.deps, DRIVER);
    expect(kit.notes.some((note) => note.startsWith('trip cancelled'))).toBe(false);
    expect((await kit.deps.bookings.find(kit.id))?.status).toBe('confirmed');
  });

  it('gives the commission back when the passenger cancels between the seat and the money (M2)', async () => {
    const { deps, addTrip, bonus, notes, wallet } = setup();
    await bonus();
    const id = idOf(await requestBooking(deps, DILNOZA, addTrip(), seats(1)));
    const { charge } = deps.wallet;
    const racing = {
      ...deps,
      wallet: {
        ...deps.wallet,
        charge: async (driverId: number, bookingId: string, amount: number) => {
          await cancelByPassenger(deps, DILNOZA, id);
          return charge(driverId, bookingId, amount);
        },
      },
    };
    expect(await confirm(racing, DRIVER, id)).toEqual({ ok: false, error: 'bookings.wrong_status' });
    expect(balanceOf(await wallet(), 'bonus')).toBe(500_000);
    expect(notes.some((note) => note.startsWith('passenger: confirmed'))).toBe(false);
  });

  it('takes «Yetib keldim» only once the passenger is in the car (B1)', async () => {
    const { deps, id, setNow } = await booked();
    const early = { ok: false, error: 'bookings.wrong_status' };
    expect(await markProgress(deps, DILNOZA, id, 'arrived')).toEqual(early);
    setNow(DEPART - HOUR);
    expect(await markProgress(deps, DILNOZA, id, 'arrived')).toEqual(early);
    setNow(MEETING);
    expect((await markMeeting(deps, DRIVER, id, 'met')).ok).toBe(true);
    expect((await markProgress(deps, DILNOZA, id, 'arrived')).ok).toBe(true);
  });
});

describe('the hourly repair of seats and money (G89 T2, M6)', () => {
  it('ends a seat a broken cancel left on a cancelled trip, with the commission back', async () => {
    const { deps, id, notes, wallet } = await booked();
    const tripId = (await deps.bookings.find(id))?.tripId ?? '';
    // The trip was cancelled, then the cancel broke before its seats.
    await deps.trips.cancel(DRIVER, tripId);
    await settleBookings(deps);
    expect((await deps.bookings.find(id))?.status).toBe('cancelled_by_driver');
    expect(balanceOf(await wallet(), 'bonus')).toBe(500_000);
    expect(notes).toContain('cancelled by driver');
  });

  it('gives back once a commission a cancel did not return', async () => {
    const { deps, id, wallet } = await booked();
    const record = await deps.bookings.find(id);
    if (!record) throw new Error('no booking');
    // The seat was cancelled, then the cancel broke before the money.
    await deps.bookings.replace({ ...record, status: 'cancelled_by_passenger' }, 'confirmed');
    await settleBookings(deps);
    await settleBookings(deps);
    expect(balanceOf(await wallet(), 'bonus')).toBe(500_000);
  });
});
