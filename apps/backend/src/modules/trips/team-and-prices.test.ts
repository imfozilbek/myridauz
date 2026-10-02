import { tashkentDate } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { realPrices } from './application/prices';
import { publishTrip } from './application/publish';
import { cancelTrip, teamTrips } from './application/read';
import { HOUR, NOW, setup } from './test-kit';

const idOf = (result: Awaited<ReturnType<typeof publishTrip>>) => (result.ok ? result.value.id : '');

describe('the trips of the team by days (docs/90 F-A6)', () => {
  it('gives every trip of the asked day, cancelled ones too, the earliest first', async () => {
    const { deps, trip } = setup();
    const late = idOf(await publishTrip(deps, 1, { ...trip, departAt: NOW + 10 * HOUR }));
    const early = idOf(await publishTrip(deps, 2, trip));
    const tomorrow = idOf(await publishTrip(deps, 1, { ...trip, departAt: NOW + 30 * HOUR }));
    await cancelTrip(deps, 2, early);
    const ids = async (day: number) => (await teamTrips(deps, tashkentDate(day))).map((item) => item.id);
    expect(await ids(NOW)).toEqual([early, late]);
    expect(await ids(NOW + 30 * HOUR)).toEqual([tomorrow]);
    expect(await ids(NOW + 5 * 24 * HOUR)).toEqual([]);
  });
});

describe('the real prices of the median (docs/90 F-A7)', () => {
  it('takes only the trips that left and were not cancelled, the newest first', async () => {
    const { deps, trip, setNow } = setup();
    await publishTrip(deps, 1, { ...trip, price: 80000 });
    await publishTrip(deps, 2, { ...trip, price: 100000, departAt: NOW + 4 * HOUR });
    const cancelled = idOf(
      await publishTrip(deps, 1, { ...trip, price: 300000, departAt: NOW + 4.5 * HOUR }),
    );
    await cancelTrip(deps, 1, cancelled);
    await publishTrip(deps, 2, { ...trip, price: 500000, departAt: NOW + 48 * HOUR });
    setNow(NOW + 5 * HOUR);
    const prices = await realPrices(deps, NOW - 24 * HOUR);
    expect(prices.map((item) => item.price)).toEqual([100000, 80000]);
    expect(prices[0]).toEqual({ from: trip.from, to: trip.to, price: 100000 });
  });
});
