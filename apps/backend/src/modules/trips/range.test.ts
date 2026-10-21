import { describe, expect, it } from 'vitest';
import { retimeTrip } from './application/change';
import { publishTrip } from './application/publish';
import { searchTrips } from './application/read';
import { HOUR, setup } from './test-kit';

// G90 (owner decision 20.10.2026, docs/216): «08:00 dan 10:00 gacha» instead of one exact time.
describe('a range of the time of a new trip', () => {
  it('keeps the end of the range and ends the trip from its last hour', async () => {
    const { deps, trip } = setup();
    const exact = await publishTrip(deps, 1, trip);
    const range = await publishTrip(deps, 2, { ...trip, departUntil: trip.departAt + 2 * HOUR });
    expect(exact.ok && exact.value.departUntil).toBe(null);
    expect(range.ok && range.value.departUntil).toBe(trip.departAt + 2 * HOUR);
    const [one, two] = await Promise.all(
      [exact, range].map((published) => deps.trips.find(published.ok ? published.value.id : '')),
    );
    expect((two?.endsAt ?? 0) - (one?.endsAt ?? 0)).toBe(2 * HOUR);
  });

  it('refuses a range not of whole hours, longer than the brand hours, or empty', async () => {
    const { deps, trip } = setup();
    for (const departUntil of [trip.departAt, trip.departAt + 4 * HOUR, trip.departAt + HOUR / 2])
      expect(await publishTrip(deps, 1, { ...trip, departUntil })).toEqual({
        ok: false,
        error: 'trips.bad_range',
      });
    const half = trip.departAt + HOUR / 2;
    expect(await publishTrip(deps, 1, { ...trip, departAt: half, departUntil: half + HOUR })).toEqual({
      ok: false,
      error: 'trips.bad_range',
    });
  });

  it('refuses a range over two days', async () => {
    const { deps, trip } = setup();
    // 23:00 in Tashkent, to 01:00 the next day.
    const late = trip.departAt + 14 * HOUR;
    expect(await publishTrip(deps, 1, { ...trip, departAt: late, departUntil: late + 2 * HOUR })).toEqual({
      ok: false,
      error: 'trips.bad_range',
    });
  });
});

describe('a range in the search and the later time (G90, docs/216)', () => {
  const SEARCH = { from: '1726', to: '1718', date: '2026-10-01' };

  it('stays in the search until its end: the driver still takes people', async () => {
    const { deps, trip, setNow } = setup();
    const made = await publishTrip(deps, 1, { ...trip, departUntil: trip.departAt + 2 * HOUR });
    const id = made.ok ? made.value.id : '';
    setNow(trip.departAt + HOUR);
    expect((await searchTrips(deps, SEARCH)).map((found) => found.id)).toEqual([id]);
    setNow(trip.departAt + 2 * HOUR + 1);
    expect(await searchTrips(deps, SEARCH)).toEqual([]);
  });

  it('moves whole by a whole hour only', async () => {
    const { deps, trip } = setup();
    const made = await publishTrip(deps, 1, { ...trip, departUntil: trip.departAt + 2 * HOUR });
    const id = made.ok ? made.value.id : '';
    expect(await retimeTrip(deps, 1, id, trip.departAt + HOUR / 2)).toEqual({
      ok: false,
      error: 'trips.invalid_input',
    });
    expect(await retimeTrip(deps, 1, id, trip.departAt + HOUR)).toMatchObject({
      ok: true,
      value: { departAt: trip.departAt + HOUR, departUntil: trip.departAt + 3 * HOUR },
    });
  });
});
