import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const [DRIVER, PASSENGER] = [95, 96];
const HOUR = 3_600_000;

// G89 U10: a ready answer of «Yangi xabar» to a chat read only 24 hours after the trip (docs/129) is
// refused, never «Yuborildi» for words that went nowhere (the sheet: sheet-routes.test.ts).
describe('a ready answer to a closed chat', () => {
  it('is refused two days after the trip', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const way = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * HOUR, seats: 3, price: 90_000 };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const seat = await read<{ id: string; chatKey: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    // Two days later: the trip is long over, the chat is read only.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 48 * HOUR });
    const answer = call(`/chats/${seat.chatKey}/messages`, PASSENGER, {
      app: 'passenger',
      ...json({ text: 'Yaxshi' }),
    });
    expect((await answer).status).toBe(403);
  });
});
