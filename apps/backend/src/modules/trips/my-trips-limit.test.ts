import { describe, expect, it } from 'vitest';
import { MY_TRIPS_LIMIT, myTrips } from './application/read';
import { publishTrip } from './application/publish';
import { HOUR, NOW, setup } from './test-kit';
import type { TripRecord } from './domain/trip';

// «Mening safarlarim» reads the newest trips only, never every trip a driver ever made; the old ones
// are in «Safarlar tarixi» (G42, docs/111).
describe('the own trips of a driver', () => {
  it('reads the newest ones only, the trips ahead always among them', async () => {
    const { deps, trip } = setup();
    const published = await publishTrip(deps, 1, trip);
    const base = await deps.trips.find(published.ok ? published.value.id : '');
    const made = (index: number, departAt: number, status: TripRecord['status']): TripRecord => ({
      ...(base as TripRecord),
      id: `t${index}`,
      driverId: 1,
      departAt,
      endsAt: departAt + HOUR,
      status,
    });
    for (let index = 0; index < MY_TRIPS_LIMIT + 20; index += 1)
      await deps.trips.save(made(index, NOW - (index + 1) * 24 * HOUR, 'completed'));
    await deps.trips.save(made(999, NOW + 24 * HOUR, 'active'));
    const mine = await myTrips(deps, 1);
    expect(mine).toHaveLength(MY_TRIPS_LIMIT);
    expect(mine.some((trip) => trip.id === 't999')).toBe(true);
    expect(mine.some((trip) => trip.id === `t${MY_TRIPS_LIMIT + 19}`)).toBe(false);
  });
});
