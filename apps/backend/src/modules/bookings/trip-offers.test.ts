import { describe, expect, it } from 'vitest';
import { acceptOffer, declineOffer } from './application/accept';
import { confirm } from './application/answer';
import { sendOffer } from './application/offers';
import { passengerBookings, requestBooking } from './application/request';
import { offerSalonTrip, openSalonTrip } from './application/salon-trip';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, seats, setup } from './test-kit';

// 2026-10-02 08:00 in Tashkent: the day of the requests.
const ON_THE_DAY = NOW + 26 * HOUR;

// «Safarimga taklif qilish» (G64, docs/118 path 7): a seat of a trip the driver already has.
describe('an offer on a trip of the driver (G64)', () => {
  it('takes the time and the price of the trip, and the booking goes on it', async () => {
    const { deps, addTrip, addRequest, bonus } = setup();
    await bonus();
    const tripId = addTrip({ departAt: ON_THE_DAY, price: 85_000 });
    const sent = await sendOffer(deps, DRIVER, addRequest(), { departAt: 0, price: 1, tripId });
    if (!sent.ok) throw new Error(sent.error);
    expect(sent.value).toMatchObject({ departAt: ON_THE_DAY, price: 85_000, tripId, seats: 2 });
    expect((await acceptOffer(deps, DILNOZA, sent.value.id)).ok).toBe(true);
    const [booking] = await passengerBookings(deps, DILNOZA);
    expect(booking).toMatchObject({ status: 'confirmed', seats: 2, trip: { id: tripId } });
    expect((await deps.trips.ofDriver(DRIVER)).length).toBe(1);
  });

  it('refuses a trip of another day, of another driver, and a whole car on a trip with a booking', async () => {
    const { deps, addTrip, addRequest, bonus } = setup();
    await bonus();
    const offer = { departAt: 0, price: 1 };
    const otherDay = addTrip({ departAt: ON_THE_DAY + 24 * HOUR });
    expect(await sendOffer(deps, DRIVER, addRequest(), { ...offer, tripId: otherDay })).toEqual({
      ok: false,
      error: 'bookings.invalid_input',
    });
    const notMine = addTrip({ departAt: ON_THE_DAY, driverId: ALI });
    expect(await sendOffer(deps, DRIVER, addRequest(), { ...offer, tripId: notMine })).toEqual({
      ok: false,
      error: 'bookings.not_found',
    });
    const taken = addTrip({ departAt: ON_THE_DAY, bookingRule: 'seats_or_car' });
    const booked = await requestBooking(deps, ALI, taken, seats(1));
    await confirm(deps, DRIVER, booked.ok ? booked.value.id : '');
    const salon = addRequest({ wholeCar: true, seats: 3 });
    expect(await sendOffer(deps, DRIVER, salon, { ...offer, tripId: taken })).toEqual({
      ok: false,
      error: 'bookings.salon_taken',
    });
  });
});

// «Safar ochib taklif qilish» (G64): a trip for the whole car of one request, seen only by its passenger.
describe('a salon trip from a request (G64)', () => {
  it('opens a hidden trip of every seat of the car at the request price and offers it', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const requestId = addRequest({ wholeCar: true, seats: 2 });
    const opened = await offerSalonTrip(deps, DRIVER, requestId, ON_THE_DAY);
    if (!opened.ok) throw new Error(opened.error);
    expect(opened.value.trip).toMatchObject({ private: true, seats: 4, price: 90_000 });
    expect(opened.value.offer).toMatchObject({ tripId: opened.value.trip.id, seats: 4, wholeCar: true });
    expect(await offerSalonTrip(deps, DRIVER, requestId, ON_THE_DAY)).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
    expect(await offerSalonTrip(deps, DRIVER, addRequest(), ON_THE_DAY)).toEqual({
      ok: false,
      error: 'bookings.invalid_input',
    });
  });

  it('becomes the passenger’s booking of the whole car on «Qabul qilish»', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const opened = await offerSalonTrip(deps, DRIVER, addRequest({ wholeCar: true }), ON_THE_DAY);
    if (!opened.ok) throw new Error(opened.error);
    await acceptOffer(deps, DILNOZA, opened.value.offer.id);
    const [booking] = await passengerBookings(deps, DILNOZA);
    expect(booking).toMatchObject({ status: 'confirmed', seats: 4, wholeCar: true });
    expect(booking?.trip).toMatchObject({ id: opened.value.trip.id, private: false });
  });

  it('opens for everybody only after the passenger said no', async () => {
    const { deps, addRequest, bonus, notes } = setup();
    await bonus();
    const opened = await offerSalonTrip(deps, DRIVER, addRequest({ wholeCar: true }), ON_THE_DAY);
    if (!opened.ok) throw new Error(opened.error);
    const tripId = opened.value.trip.id;
    expect(await openSalonTrip(deps, DRIVER, tripId)).toEqual({ ok: false, error: 'bookings.wrong_status' });
    await declineOffer(deps, DILNOZA, opened.value.offer.id);
    const open = await openSalonTrip(deps, DRIVER, tripId);
    expect(open.ok && open.value.private).toBe(false);
    expect(notes).toContain(`trip opened ${tripId}`);
  });
});
