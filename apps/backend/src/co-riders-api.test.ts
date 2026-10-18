import type { Complaint } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { call, doorBooking, pid, registerUser } from './test-api';

const DRIVER = 311;
const ANVAR = 312;
const BOBUR = 313;
const SARDOR = 314;
const STRANGER = 315;
type Riders = { riders: { id: string; firstName: string; hasAvatar: boolean }[] };

async function seat(tripId: string, passenger: number, confirm: boolean) {
  await registerUser(passenger);
  const booking = await read<{ id: string }>(
    call(`/trips/${tripId}/bookings`, passenger, json(doorBooking(1))),
  );
  if (confirm)
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  return booking.id;
}

// Passengers of one trip see each other's faces and may complain about each other (G46, docs/05,
// docs/17, docs/111 Q4); one who only asked for a seat is nobody's companion yet.
describe('the companions of a passenger', () => {
  it('shows the other confirmed passengers; a complaint about one of them reaches the team', async () => {
    await approvedDriver(DRIVER);
    const way = {
      from: '1726273',
      to: '1718401',
      departAt: Date.now() + 5 * 3_600_000,
      seats: 3,
      price: 90_000,
    };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const mine = await seat(trip.id, ANVAR, true);
    await seat(trip.id, BOBUR, true);
    await seat(trip.id, SARDOR, false);
    await registerUser(STRANGER);
    const riders = await read<Riders>(call(`/passenger/bookings/${mine}/riders`, ANVAR));
    expect(riders.riders).toEqual([{ id: await pid(BOBUR), firstName: 'Ali', hasAvatar: false }]);
    expect((await call(`/passenger/bookings/${mine}/riders`, STRANGER)).status).toBe(404);
    const about = async (id: number) => json({ bookingId: mine, reasons: ['other'], about: await pid(id) });
    expect((await call('/complaints', ANVAR, await about(SARDOR))).status).toBe(404);
    expect((await call('/complaints', ANVAR, await about(BOBUR))).status).toBe(201);
    // One complaint of one person about one ride (docs/17).
    expect((await call('/complaints', ANVAR, await about(BOBUR))).status).toBe(409);
    const queue = await read<{ complaints: Complaint[] }>(call('/admin/complaints', OWNER, { app: 'admin' }));
    const author = await pid(ANVAR);
    const filed = queue.complaints.find((complaint) => complaint.author.id === author);
    expect([filed?.against.id, filed?.against.role]).toEqual([await pid(BOBUR), 'passenger']);
  });
});
