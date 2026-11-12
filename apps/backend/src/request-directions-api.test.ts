import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 641;
const PASSENGER = 642;
const asDriver = { app: 'driver' } as const;
type Cards = { directions: { to: string; today: number; tomorrow: number }[] };

// «Qayerga» of a driver without mocks (owner decision 12.11.2026, docs/118): the demand by region.
describe('the requests of each direction API', () => {
  it('counts the requests of tomorrow from the region of «Qayerdan», the busy region first', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const body = { from: '1726273', to: '1718401', date, seats: 1, price: 90_000, ...REQUEST_WAY };
    expect((await call('/passenger/requests', PASSENGER, json(body))).status).toBe(201);
    const cards = await read<Cards>(call('/driver/requests/directions?from=1726', DRIVER, asDriver));
    expect(cards.directions[0]).toEqual({ to: '1718', today: 0, tomorrow: 1 });
    expect(cards.directions.map((card) => card.to)).not.toContain('1726');
    const bad = await call('/driver/requests/directions', DRIVER, asDriver);
    expect(bad.status).toBe(400);
  });
});
