import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { sendReminders } from './modules/reminders';
import { call, registerUser, testEnv, doorBooking } from './test-api';

const telegram: { chat: unknown; text: string }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ chat: body.chat_id, text: String(body.text ?? '') });
  return Response.json({ ok: true, result: { message_id: 1 } });
});
// 2026-10-01 10:00 in Tashkent: the day time.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(Date.parse('2026-10-01T05:00:00Z'));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 81;
const PASSENGER = 82;

describe('trip reminders (G10)', () => {
  it('reminds the passenger and the driver of a booked trip once, a day before', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const departAt = Date.now() + 23 * 3_600_000;
    const trip = {
      from: '1726273',
      to: '1718401',
      departAt,
      seats: 3,
      price: 90_000,
      womanOnBoard: false,
      pickupMode: 'both',
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
    await sendReminders(testEnv, Date.now());
    await sendReminders(testEnv, Date.now());
    expect(telegram.map((item) => item.chat)).toEqual([PASSENGER, DRIVER]);
    expect(telegram[0]?.text).toContain('Eslatma: safaringiz bor.');
    expect(telegram[0]?.text).toContain('01 A 123 BC');
    expect(telegram[1]?.text).toContain('Yoʻlovchilar: 2 kishi');
  });
});
