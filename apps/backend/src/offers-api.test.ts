import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 71;
const PASSENGER = 72;
const OTHER_PASSENGER = 73;
// One live trip and one seat at a time (docs/172): the other tests take their own people.
const OTHER_DRIVER = 74;
const BUSY_DRIVER = 75;
const FIRST = 76;
const SECOND = 77;
const PRICE = 90_000;

type Offer = { id: string; status: string; bookingId: string | null };

// A request of the passenger on the day and an offer of the driver on it at 10:00.
async function offered(driverId: number, passengerId: number, date: string) {
  const request = await read<{ id: string }>(
    call(
      '/passenger/requests',
      passengerId,
      json({ from: '1726273', to: '1718401', date, seats: 1, price: PRICE, ...REQUEST_WAY }),
    ),
  );
  return read<Offer>(
    call(`/driver/requests/${request.id}/offers`, driverId, {
      app: 'driver',
      ...json({ departAt: Date.parse(`${date}T05:00:00Z`), price: PRICE }),
    }),
  );
}

// The second way to a seat (docs/35): a request, a driver's offer, the passenger accepts it.
describe('offers API (docs/35, G08)', () => {
  it('turns an accepted offer into a trip and a confirmed booking, charged once', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(OTHER_PASSENGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const request = await read<{ id: string }>(
      call(
        '/passenger/requests',
        PASSENGER,
        json({ from: '1726273', to: '1718401', date, seats: 2, price: PRICE, ...REQUEST_WAY }),
      ),
    );
    const departAt = Date.parse(`${date}T04:00:00Z`);
    const bad = await call(`/driver/requests/${request.id}/offers`, DRIVER, { app: 'driver', ...json({}) });
    expect(bad.status).toBe(400);
    const offer = await read<Offer>(
      call(`/driver/requests/${request.id}/offers`, DRIVER, {
        app: 'driver',
        ...json({ departAt, price: PRICE }),
      }),
    );
    expect(offer.status).toBe('sent');
    const sent = await read<{ offers: Offer[] }>(call('/driver/offers', DRIVER, { app: 'driver' }));
    expect(sent.offers).toHaveLength(1);
    const mine = await read<{ offers: Offer[] }>(call('/passenger/offers', PASSENGER));
    expect(mine.offers[0]?.id).toBe(offer.id);
    // Only the passenger of the request answers it.
    const stranger = await call(`/passenger/offers/${offer.id}/accept`, OTHER_PASSENGER, { method: 'POST' });
    expect(stranger.status).toBe(404);
    const accepted = await read<Offer>(
      call(`/passenger/offers/${offer.id}/accept`, PASSENGER, { method: 'POST' }),
    );
    expect(accepted.status).toBe('accepted');
    expect(accepted.bookingId).not.toBeNull();
    const again = await call(`/passenger/offers/${offer.id}/accept`, PASSENGER, { method: 'POST' });
    expect(again.status).toBe(409);
    const wallet = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    expect(wallet.bonus).toBe(500_000 - 2 * 9000);
    const bookings = await read<{ bookings: { status: string }[] }>(call('/passenger/bookings', PASSENGER));
    expect(bookings.bookings.map((booking) => booking.status)).toEqual(['confirmed']);
  });

  it('lets the passenger decline an offer', async () => {
    await approvedDriver(OTHER_DRIVER);
    const date = tashkentDate(Date.now() + 2 * DAY_MS);
    const offer = await offered(OTHER_DRIVER, OTHER_PASSENGER, date);
    const declined = await read<Offer>(
      call(`/passenger/offers/${offer.id}/decline`, OTHER_PASSENGER, { method: 'POST' }),
    );
    expect(declined.status).toBe('declined');
  });

  it('ends the other offers of a driver without a trip once one is accepted (docs/172)', async () => {
    await approvedDriver(BUSY_DRIVER);
    await registerUser(FIRST);
    await registerUser(SECOND);
    const date = tashkentDate(Date.now() + 3 * DAY_MS);
    const taken = await offered(BUSY_DRIVER, FIRST, date);
    const other = await offered(BUSY_DRIVER, SECOND, date);
    await call(`/passenger/offers/${taken.id}/accept`, FIRST, { method: 'POST' });
    const left = await read<{ offers: Offer[] }>(call('/passenger/offers', SECOND));
    expect(left.offers.find((offer) => offer.id === other.id)?.status).toBe('expired');
  });
});
