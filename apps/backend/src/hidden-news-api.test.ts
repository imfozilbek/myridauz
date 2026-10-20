import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

const texts: { chat: unknown; text: string }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  texts.push({ chat: body.chat_id, text: String(body.text ?? '') });
  return Response.json({ ok: true, result: { message_id: texts.length } });
});
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 321;
const SUBSCRIBER = 322;
const RIDERS = [323, 324, 325];

// G89 B15: a driver hidden from search by complaints (docs/17) is in no news of the subscribers.
describe('the news of a person hidden by complaints', () => {
  it('a cheaper trip of a hidden driver reaches no subscriber', async () => {
    await approvedDriver(DRIVER);
    await registerUser(SUBSCRIBER);
    const route = { from: '1726', to: '1718', date: null, woman: false };
    await call('/passenger/subscriptions', SUBSCRIBER, json(route));
    const way = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 4 };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, price: 90_000, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    for (const rider of RIDERS) {
      await registerUser(rider);
      const seat = await read<{ id: string }>(
        call(`/trips/${trip.id}/bookings`, rider, json(doorBooking(1))),
      );
      await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
      const complaint = json({ bookingId: seat.id, reasons: ['other'] });
      expect((await call('/complaints', rider, complaint)).status).toBe(201);
    }
    texts.length = 0;
    const lower = { app: 'driver', ...json({ price: 85_000 }) };
    expect((await call(`/driver/trips/${trip.id}/price`, DRIVER, lower)).status).toBe(200);
    const told = texts.filter((sent) => sent.chat === SUBSCRIBER && sent.text.includes('arzonlashdi'));
    expect(told).toEqual([]);
  });
});
