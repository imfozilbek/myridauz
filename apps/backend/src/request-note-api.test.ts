import { BOOKING_NOTE_MAX, DAY_MS, rideRequestInputSchema, tashkentDate } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

const DRIVER = 481;
const PASSENGER = 482;
const PRICE = 90_000;
type Seat = { id: string; note: string | null };

const ask = (passengerId: number, note: string) =>
  read<{ id: string }>(
    call(
      '/passenger/requests',
      passengerId,
      json({
        from: '1726273',
        to: '1718401',
        date: tashkentDate(Date.now() + DAY_MS),
        seats: 1,
        price: PRICE,
        ...REQUEST_WAY,
        note,
      }),
    ),
  );

// «Izoh» of a request (G48, docs/68): «Koʻk darvoza» reaches the driver with the points of the seat
// of an accepted offer, without contacts (docs/07).
describe('the note of a request', () => {
  it('reaches the driver with the seat of the accepted offer, without a phone in it', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const request = await ask(PASSENGER, 'Koʻk darvoza, +998 90 123 45 67');
    const offer = await read<{ id: string }>(
      call(`/driver/requests/${request.id}/offers`, DRIVER, {
        app: 'driver',
        ...json({ departAt: Date.now() + DAY_MS, price: PRICE }),
      }),
    );
    await call(`/passenger/offers/${offer.id}/accept`, PASSENGER, { method: 'POST' });
    const { bookings } = await read<{ bookings: Seat[] }>(
      call('/driver/bookings', DRIVER, { app: 'driver' }),
    );
    expect(bookings[0]?.note).toMatch(/^Koʻk darvoza, /u);
    expect(bookings[0]?.note).not.toMatch(/123/u);
  });

  it('is short by the contract', () => {
    expect(rideRequestInputSchema.shape.note.safeParse('a'.repeat(BOOKING_NOTE_MAX)).success).toBe(true);
    expect(rideRequestInputSchema.shape.note.safeParse('a'.repeat(BOOKING_NOTE_MAX + 1)).success).toBe(false);
  });
});
