import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const DRIVER = 97;
const PASSENGER = 98;
// Telegram refuses every message to the passenger: she blocked the bot (docs/80 S07).
const BLOCKED = { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' };
const sent: number[] = [];
let refused = 0;
let bookingId = '';
let tripId = '';
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
    bookingId = booking.id;
    tripId = trip.id;
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

  // G46 (docs/191): after the first 403 the bot is quiet to her until she comes back with /start.
  it('sends her nothing more until /start, then talks to her again', async () => {
    refused = 0;
    expect((await call(`/passenger/bookings/${bookingId}/cancel`, PASSENGER, json({}))).status).toBe(200);
    expect(refused).toBe(0);
    await bot({
      message: { message_id: 1, text: '/start', chat: { id: PASSENGER }, from: { id: PASSENGER } },
    });
    const again = await call(`/trips/${tripId}/bookings`, PASSENGER, json(doorBooking(1)));
    const booking = await read<{ id: string }>(Promise.resolve(again));
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    expect(refused).toBeGreaterThan(0);
  });

  it('is quiet to a person Telegram says blocked the bot, before any message failed', async () => {
    await bot({
      my_chat_member: { chat: { id: PASSENGER, type: 'private' }, new_chat_member: { status: 'kicked' } },
    });
    refused = 0;
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    const live = mine.bookings.find((item) => item.status === 'confirmed');
    expect((await call(`/passenger/bookings/${live?.id}/cancel`, PASSENGER, json({}))).status).toBe(200);
    expect(refused).toBe(0);
  });
});

// An update of the passenger bot, as Telegram sends it.
function bot(update: object) {
  return app.request(
    '/telegram/passenger',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'hook' },
      body: JSON.stringify(update),
    },
    { ...testEnv, TELEGRAM_WEBHOOK_SECRET: 'hook' },
  );
}
