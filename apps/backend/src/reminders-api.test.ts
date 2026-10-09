import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { sendReminders } from './modules/reminders';
import { call, registerUser, testEnv, doorBooking } from './test-api';

const telegram: { chat: unknown; text: string; method: string }[] = [];
let messageId = 100;
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  const method = input.split('/').pop() ?? '';
  telegram.push({ chat: body.chat_id, text: String(body.text ?? ''), method });
  return Response.json({ ok: true, result: { message_id: messageId++ } });
});
// 2026-10-01 10:00 in Tashkent: the day time.
const START = Date.parse('2026-10-01T05:00:00Z');
const HOUR = 3_600_000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(START);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 81;
const PASSENGER = 82;

describe('trip reminders (G10, G68)', () => {
  it('the day before both trip cards say «Ertaga» quietly; 2 hours before both ring', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const departAt = START + 47 * HOUR;
    const trip = {
      from: '1726273',
      to: '1718401',
      departAt,
      seats: 3,
      price: 90_000,
      womanOnBoard: false,
      pickupMode: 'door',
      comment: '',
    };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(trip) }),
    );
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(2))),
    );
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    telegram.length = 0;
    vi.setSystemTime(START + 24 * HOUR);
    await sendReminders(testEnv, Date.now());
    await sendReminders(testEnv, Date.now());
    expect(telegram.map((item) => `${String(item.chat)} ${item.method}`)).toEqual([
      `${PASSENGER} editMessageText`,
      `${DRIVER} editMessageText`,
    ]);
    expect(telegram[0]?.text).toContain('Ertaga');
    expect(telegram[0]?.text).toContain('01 A 123 BC');
    expect(telegram[1]?.text).toContain('Ertaga');
    // Two hours before: a ring under the card (docs/122).
    telegram.length = 0;
    vi.setSystemTime(departAt - 90 * 60_000);
    await sendReminders(testEnv, Date.now());
    const ring = telegram.find((item) => item.chat === PASSENGER && item.method === 'sendMessage');
    expect(ring?.text).toContain('2 soat qoldi');
    const driverRing = telegram.find((item) => item.chat === DRIVER && item.method === 'sendMessage');
    expect(driverRing?.text).toMatch(/^🚏 2 soat qoldi: 2 yoʻlovchi, birinchisi \d\d:\d\d da · /u);
  });
});
