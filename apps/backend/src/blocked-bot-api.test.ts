import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

const DRIVER = 97;
const PASSENGER = 98;
// Telegram refuses every message to the passenger: she blocked the bot (docs/80 S07).
const BLOCKED = { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' };
const sent: number[] = [];
let refused = 0;
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as { chat_id?: number }) : {};
  if (body.chat_id === PASSENGER) {
    refused += 1;
    return Response.json(BLOCKED, { status: 403 });
  }
  if (body.chat_id !== undefined) sent.push(body.chat_id);
  return Response.json({ ok: true, result: { message_id: 1 } });
});
afterAll(() => vi.unstubAllGlobals());

// A message that can never reach a person is dropped; the rest of Rida goes on (docs/07, G49).
describe('a person who blocked the bot', () => {
  it('still books and gets the seat; the driver hears about it as usual', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({
          from: '1726273',
          to: '1718401',
          departAt: Date.now() + 5 * 3_600_000,
          seats: 3,
          price: 90_000,
          womanOnBoard: false,
          pickupMode: 'door',
          comment: '',
        }),
      }),
    );
    sent.length = 0;
    const booked = await call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1)));
    expect(booked.status).toBe(201);
    const booking = await read<{ id: string }>(Promise.resolve(booked));
    expect(sent).toContain(DRIVER);
    const confirmed = await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, {
      method: 'POST',
      app: 'driver',
    });
    expect(confirmed.status).toBe(200);
    // The bot tried to tell her and Telegram refused: the confirmation stands all the same.
    expect(refused).toBeGreaterThan(0);
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    expect(mine.bookings.find((item) => item.id === booking.id)?.status).toBe('confirmed');
  });
});
