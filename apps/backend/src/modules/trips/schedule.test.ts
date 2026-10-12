import { describe, expect, it } from 'vitest';
import { arriveTrip, departTrip } from './application/progress';
import { publishTrip } from './application/publish';
import { cancelTrip } from './application/read';
import { driverSchedule } from './application/schedule';
import { HOUR, NOW, setup } from './test-kit';

// G38 (owner decisions 03.10.2026, docs/103) and one live trip at a time (owner decision 12.10.2026,
// docs/172). In the kit a trip is 300 km, 5 hours on the road; the way back has no pitak.
const DAY = 24 * HOUR;
const BACK = { from: '1718401', to: '1726273', pickupMode: 'door' } as const;

describe('when a driver may leave (docs/103, docs/172)', () => {
  it('leaves an hour after the trip is made at the earliest', async () => {
    const { deps, trip } = setup();
    const soon = await publishTrip(deps, 1, { ...trip, departAt: NOW + HOUR / 2 });
    expect(soon).toEqual({ ok: false, error: 'trips.too_soon' });
    expect((await publishTrip(deps, 1, { ...trip, departAt: NOW + HOUR })).ok).toBe(true);
  });

  it('keeps one live trip of a driver, on any day', async () => {
    const { deps, trip } = setup();
    expect(await driverSchedule(deps, 1)).toEqual({ full: false });
    expect((await publishTrip(deps, 1, trip)).ok).toBe(true);
    expect(await driverSchedule(deps, 1)).toEqual({ full: true });
    const next = await publishTrip(deps, 1, { ...trip, departAt: trip.departAt + 3 * DAY });
    expect(next).toEqual({ ok: false, error: 'trips.too_many' });
    // Another driver is free.
    expect(await driverSchedule(deps, 2)).toEqual({ full: false });
  });

  it('frees the driver at «Yetib keldik»: the way back today (G78 В11)', async () => {
    const { deps, trip, setNow } = setup();
    const there = await publishTrip(deps, 1, trip);
    if (!there.ok) throw new Error(there.error);
    setNow(trip.departAt);
    await departTrip(deps, 1, there.value.id);
    const arrival = trip.departAt + 4 * HOUR;
    setNow(arrival);
    await arriveTrip(deps, 1, there.value.id);
    expect(await driverSchedule(deps, 1)).toEqual({ full: false });
    const back = await publishTrip(deps, 1, { ...trip, ...BACK, departAt: arrival + 2 * HOUR });
    expect(back.ok).toBe(true);
  });

  it('frees the driver when the trip is cancelled', async () => {
    const { deps, trip } = setup();
    const first = await publishTrip(deps, 1, trip);
    if (!first.ok) throw new Error(first.error);
    await cancelTrip(deps, 1, first.value.id);
    expect((await publishTrip(deps, 1, { ...trip, departAt: trip.departAt + DAY })).ok).toBe(true);
  });
});
