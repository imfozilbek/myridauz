import { describe, expect, it } from 'vitest';
import { balanceOf } from '../wallet/domain/ledger';
import { answer, confirm, driverBookings } from './application/answer';
import { cancelByPassenger, passengerBookings, requestBooking } from './application/request';
import { rideTogether } from './infrastructure/store';
import { ALI, AWAY, DILNOZA, DRIVER, HOME, HOUR, NOW, OLIM, seats, setup } from './test-kit';

const NAMED_NAME = { step: 'mahalla', name: 'Qatortol' };
const AREA = { step: 'district', name: 'Chilonzor' };

const value = <T>(result: { ok: true; value: T } | { ok: false; error: string }) => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('a booking of seats (docs/35)', () => {
  it('opens the places and the plate only after the confirmation, and takes the bonus first', async () => {
    const { deps, addTrip, bonus, wallet, notes } = setup();
    await bonus();
    const tripId = addTrip();
    const asked = value(await requestBooking(deps, DILNOZA, tripId, seats(2)));
    expect(asked).toMatchObject({ status: 'requested', commission: 0, mode: 'door', plate: null });
    // The passenger sees the own points and their names at once (docs/70).
    expect(asked.pickup).toEqual({ point: HOME, name: NAMED_NAME, area: AREA });
    expect(notes).toContain('driver: request Dilnoza');
    const [waiting] = await driverBookings(deps, DRIVER);
    // 10% of 90 000 per seat, 2 seats; the driver never sees a passenger's photo (docs/05).
    expect(waiting).toMatchObject({
      commission: 18_000,
      passenger: { firstName: 'Dilnoza', hasAvatar: false },
    });
    // Before the confirmation the driver sees only the area of the points (docs/70).
    expect(waiting?.pickup).toEqual({ point: null, name: null, area: AREA });
    const confirmed = value(await confirm(deps, DRIVER, asked.id));
    expect(confirmed).toMatchObject({ status: 'confirmed', plate: null, trip: { seatsLeft: 1 } });
    const [mine] = await passengerBookings(deps, DILNOZA);
    expect(mine).toMatchObject({ plate: '01A123BC', dropoff: { point: AWAY } });
    expect(balanceOf(await wallet(), 'bonus')).toBe(482_000);
    expect(notes).toContain('passenger: confirmed 01A123BC');
    // After the confirmation the driver sees the point and its name.
    expect((await driverBookings(deps, DRIVER))[0]?.pickup).toEqual({
      point: HOME,
      name: NAMED_NAME,
      area: AREA,
    });
  });

  it('cannot be confirmed without money, and never charges twice', async () => {
    const { deps, addTrip, bonus, wallet } = setup();
    const tripId = addTrip();
    const asked = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    expect(await confirm(deps, DRIVER, asked.id)).toEqual({ ok: false, error: 'wallet.not_enough' });
    await bonus();
    const both = await Promise.all([confirm(deps, DRIVER, asked.id), confirm(deps, DRIVER, asked.id)]);
    expect(both.filter((result) => result.ok)).toHaveLength(1);
    expect((await wallet()).filter((op) => op.kind === 'commission')).toHaveLength(1);
  });

  it('refunds when the passenger or the driver cancels (docs/12)', async () => {
    const { deps, addTrip, bonus, wallet } = setup();
    await bonus();
    const tripId = addTrip();
    const first = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    const second = value(await requestBooking(deps, ALI, tripId, seats(1)));
    await confirm(deps, DRIVER, first.id);
    await confirm(deps, DRIVER, second.id);
    expect(balanceOf(await wallet(), 'bonus')).toBe(482_000);
    value(await cancelByPassenger(deps, DILNOZA, first.id));
    expect(balanceOf(await wallet(), 'bonus')).toBe(491_000);
    expect(value(await answer(deps, DRIVER, second.id, 'driver_cancel')).status).toBe('cancelled_by_driver');
    expect(balanceOf(await wallet(), 'bonus')).toBe(500_000);
  });

  it('keeps the limits: not the own trip, free seats, one per trip, 3 waiting at once', async () => {
    const { deps, addTrip } = setup();
    const tripId = addTrip();
    expect(await requestBooking(deps, DRIVER, tripId, seats(1))).toEqual({
      ok: false,
      error: 'bookings.own_trip',
    });
    expect(await requestBooking(deps, OLIM, tripId, seats(4))).toEqual({
      ok: false,
      error: 'bookings.no_seats',
    });
    value(await requestBooking(deps, OLIM, tripId, seats(1)));
    expect(await requestBooking(deps, OLIM, tripId, seats(1))).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
    value(await requestBooking(deps, OLIM, addTrip(), seats(1)));
    value(await requestBooking(deps, OLIM, addTrip(), seats(1)));
    expect(await requestBooking(deps, OLIM, addTrip(), seats(1))).toEqual({
      ok: false,
      error: 'bookings.too_many',
    });
  });

  it('expires a request without an answer after 24 hours or at the departure', async () => {
    const { deps, addTrip, bonus, setNow } = setup();
    await bonus();
    const asked = value(await requestBooking(deps, DILNOZA, addTrip(), seats(1)));
    const soon = value(await requestBooking(deps, ALI, addTrip({ departAt: NOW + 3 * HOUR }), seats(1)));
    setNow(NOW + 4 * HOUR);
    expect(await confirm(deps, DRIVER, soon.id)).toEqual({ ok: false, error: 'bookings.wrong_status' });
    setNow(NOW + 25 * HOUR);
    expect((await passengerBookings(deps, DILNOZA))[0]?.status).toBe('expired');
    expect(await confirm(deps, DRIVER, asked.id)).toEqual({ ok: false, error: 'bookings.wrong_status' });
    expect(await answer(deps, DRIVER, asked.id, 'decline')).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
  });
});

describe('photos of passengers (docs/05)', () => {
  it('are seen by passengers with confirmed bookings on the same trip only', async () => {
    const { deps, addTrip, bonus } = setup();
    await bonus();
    const tripId = addTrip();
    const first = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    const second = value(await requestBooking(deps, ALI, tripId, seats(1)));
    expect(await rideTogether(deps.bookings, DILNOZA, ALI)).toBe(false);
    await confirm(deps, DRIVER, first.id);
    await confirm(deps, DRIVER, second.id);
    expect(await rideTogether(deps.bookings, DILNOZA, ALI)).toBe(true);
    expect(await rideTogether(deps.bookings, DILNOZA, OLIM)).toBe(false);
  });
});
