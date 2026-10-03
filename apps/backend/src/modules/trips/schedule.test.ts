import { describe, expect, it } from 'vitest';
import { publishTrip } from './application/publish';
import { driverSchedule } from './application/schedule';
import { HOUR, NOW, setup } from './test-kit';

// G38 (owner decisions 03.10.2026, docs/103). In the kit a trip is 300 km, 5 hours on the road, so
// gathering its people takes 2.5 hours; every other place is 5 hours away.
const DAY = 24 * HOUR;
const BACK = { from: '1718401', to: '1726273' };
const ELSEWHERE = { from: '1718233', to: '1726294' };

describe('when a driver may leave (docs/103)', () => {
  it('leaves an hour after the trip is made at the earliest', async () => {
    const { deps, trip } = setup();
    const soon = await publishTrip(deps, 1, { ...trip, departAt: NOW + HOUR / 2 });
    expect(soon).toEqual({ ok: false, error: 'trips.too_soon' });
    expect((await publishTrip(deps, 1, { ...trip, departAt: NOW + HOUR })).ok).toBe(true);
  });

  it('keeps at most 3 active trips of a driver', async () => {
    const { deps, trip } = setup();
    for (let day = 0; day < 3; day += 1)
      await publishTrip(deps, 1, { ...trip, departAt: trip.departAt + day * DAY });
    const fourth = await publishTrip(deps, 1, { ...trip, departAt: trip.departAt + 3 * DAY });
    expect(fourth).toEqual({ ok: false, error: 'trips.too_many' });
  });

  it('takes the way back after the arrival and the time to gather people', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, trip);
    const arrival = trip.departAt + 5 * HOUR;
    const early = await publishTrip(deps, 1, { ...trip, ...BACK, departAt: arrival + 2 * HOUR });
    expect(early).toEqual({ ok: false, error: 'trips.busy' });
    expect((await publishTrip(deps, 1, { ...trip, ...BACK, departAt: arrival + 2.5 * HOUR })).ok).toBe(true);
  });

  it('adds the road to a start elsewhere, and makes it to the next trip too', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, { ...trip, departAt: NOW + 2 * DAY });
    const before = (departAt: number) => publishTrip(deps, 1, { ...trip, ...ELSEWHERE, departAt });
    // 5 hours of its own, 5 to the start of the next trip and 2.5 to gather its people.
    expect(await before(NOW + 2 * DAY - 12 * HOUR)).toEqual({ ok: false, error: 'trips.busy' });
    expect((await before(NOW + 2 * DAY - 12.5 * HOUR)).ok).toBe(true);
    const after = NOW + 2 * DAY + 5 * HOUR + 5 * HOUR + 2.5 * HOUR;
    expect((await publishTrip(deps, 1, { ...trip, ...ELSEWHERE, departAt: after })).ok).toBe(true);
  });

  it('gives the screen the busy times and the limit', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, trip);
    const schedule = await driverSchedule(deps, 1, { ...BACK, km: 300 });
    expect(schedule).toEqual({
      windows: [{ from: trip.departAt - 5 * HOUR - 2.5 * HOUR, to: trip.departAt + 7.5 * HOUR }],
      full: false,
    });
  });
});
