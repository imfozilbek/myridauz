import { personActivityPath, personActivitySchema } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { changeModerator } from './modules/team';
import { call, doorBooking, pid, registerUser, testEnv } from './test-api';

const DRIVER = 81;
const PASSENGER = 82;
const MODERATOR = 954;
const team = { app: 'admin' };
const trip = {
  from: '1726273',
  to: '1718401',
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
};
const activity = async (userId: number) =>
  personActivitySchema.parse(await (await call(personActivityPath(await pid(userId)), OWNER, team)).json());

// «Odamlar» of the owner (G45, docs/111): what a person did lately, the trips, the seats, the
// complaints against them and the seats cancelled after a «yes» (docs/81 A07).
describe('what a person did lately', () => {
  it('shows the trips of the driver and the seats of the passenger with the cancels and complaints', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const departAt = Date.now() + 5 * 3_600_000;
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json({ ...trip, departAt }) }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const filed = await call(
      '/complaints',
      PASSENGER,
      json({ bookingId: booking.id, reasons: ['unsafe_driving'] }),
    );
    expect(filed.status).toBe(201);
    expect((await call(`/passenger/bookings/${booking.id}/cancel`, PASSENGER, json({}))).status).toBe(200);

    const driver = await activity(DRIVER);
    expect(driver.trips).toEqual([
      { id: published.id, from: trip.from, to: trip.to, departAt, status: 'active' },
    ]);
    expect(driver.complaints.map((item) => [item.reasons, item.status])).toEqual([
      [['unsafe_driving'], 'new'],
    ]);
    expect(driver.cancels).toEqual({ asDriver: 0, asPassenger: 0 });
    const passenger = await activity(PASSENGER);
    expect(passenger.rides).toEqual([
      {
        id: booking.id,
        tripId: published.id,
        from: trip.from,
        to: trip.to,
        departAt,
        status: 'cancelled_by_passenger',
      },
    ]);
    expect(passenger.cancels).toEqual({ asDriver: 0, asPassenger: 1 });
    expect((await call(personActivityPath('f'.repeat(32)), OWNER, team)).status).toBe(404);
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    expect((await call(personActivityPath(await pid(DRIVER)), MODERATOR, team)).status).toBe(403);
  });
});
