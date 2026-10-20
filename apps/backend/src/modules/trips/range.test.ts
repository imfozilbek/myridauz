import { describe, expect, it } from 'vitest';
import { publishTrip } from './application/publish';
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
