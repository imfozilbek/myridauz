import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 76;
const PASSENGER = 77;
const PRICE = 90_000;

type Request = { id: string; wholeCar: boolean; withWoman: boolean };
type Offer = { id: string; seats: number; wholeCar: boolean };
type Booking = { seats: number; wholeCar: boolean; withWoman: boolean; trip: { woman: boolean } };

// The marks of a request through D1 (G61, docs/118 path 4): «Boʻsh salon kerak» and «Men bilan ayol bor».
describe('a request with marks (G61)', () => {
  it('keeps the marks, drivers see them, the accepted offer books the whole car with the mark', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const body = { from: '1726273', to: '1718401', date, seats: 2, price: PRICE, ...REQUEST_WAY };
    const request = await read<Request>(
      call('/passenger/requests', PASSENGER, json({ ...body, wholeCar: true, withWoman: true })),
    );
    expect(request).toMatchObject({ wholeCar: true, withWoman: true });
    const search = `/driver/requests?from=1726&to=1718&date=${date}`;
    const found = await read<{ requests: Request[] }>(call(search, DRIVER, { app: 'driver' }));
    expect(found.requests.find((item) => item.id === request.id)?.wholeCar).toBe(true);
    const offer = await read<Offer>(
      call(`/driver/requests/${request.id}/offers`, DRIVER, {
        app: 'driver',
        ...json({ departAt: Date.parse(`${date}T04:00:00Z`), price: PRICE }),
      }),
    );
    expect(offer).toMatchObject({ seats: 4, wholeCar: true });
    await call(`/passenger/offers/${offer.id}/accept`, PASSENGER, { method: 'POST' });
    const { bookings } = await read<{ bookings: Booking[] }>(call('/passenger/bookings', PASSENGER));
    expect(bookings[0]).toMatchObject({ seats: 4, wholeCar: true, withWoman: true, trip: { woman: true } });
  });
});
