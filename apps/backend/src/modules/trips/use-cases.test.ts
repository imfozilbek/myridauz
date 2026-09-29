import { describe, expect, it } from 'vitest';
import { setMeetingPoint } from './application/meeting-point';
import { publishTrip } from './application/publish';
import { cancelTrip, myTrips, searchTrips, teamTrips, tripDetail } from './application/read';
import { HOUR, NOW, setup } from './test-kit';

describe('publishing a trip (docs/09, docs/35)', () => {
  it('lets only an approved driver publish, within the car seats, the price bounds and in the future', async () => {
    const { deps, trip } = setup();
    expect(await publishTrip(deps, 3, trip)).toEqual({ ok: false, error: 'trips.not_driver' });
    expect(await publishTrip(deps, 1, { ...trip, seats: 5 })).toEqual({
      ok: false,
      error: 'trips.too_many_seats',
    });
    expect(await publishTrip(deps, 1, { ...trip, departAt: NOW - HOUR })).toEqual({
      ok: false,
      error: 'trips.in_past',
    });
    expect(await publishTrip(deps, 1, { ...trip, departAt: NOW + 40 * 24 * HOUR })).toEqual({
      ok: false,
      error: 'trips.invalid_input',
    });
    expect(await publishTrip(deps, 1, { ...trip, price: 20000 })).toEqual({
      ok: false,
      error: 'trips.price_out_of_bounds',
    });
    expect(await publishTrip(deps, 1, { ...trip, to: '1726294' })).toEqual({
      ok: false,
      error: 'locations.inside_city',
    });
    const published = await publishTrip(deps, 1, trip);
    expect(published.ok && published.value).toMatchObject({ km: 300, status: 'active', woman: false });
  });

  it('keeps at most 5 active trips of a driver', async () => {
    const { deps, trip } = setup();
    for (let index = 0; index < 5; index += 1) await publishTrip(deps, 1, trip);
    expect(await publishTrip(deps, 1, trip)).toEqual({ ok: false, error: 'trips.too_many' });
  });

  it('keeps the price of a published trip when the formula changes (docs/23)', async () => {
    const { deps, trip, setFormula } = setup();
    const published = await publishTrip(deps, 1, trip);
    setFormula(150000);
    const id = published.ok ? published.value.id : '';
    expect((await tripDetail(deps, id))?.price).toBe(90000);
  });
});

describe('finding trips (docs/06, docs/14)', () => {
  it('finds by a place or a region, the whole of Tashkent for any district, and filters "ayol bor"', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, trip);
    await publishTrip(deps, 2, { ...trip, to: '1718233', departAt: NOW + 5 * HOUR });
    const search = { from: '1726294', to: '1718', date: '2026-10-01' };
    expect((await searchTrips(deps, search)).map((item) => item.driver.id)).toEqual([1, 2]);
    expect((await searchTrips(deps, { ...search, to: '1718401' })).map((item) => item.driver.id)).toEqual([
      1,
    ]);
    expect((await searchTrips(deps, { ...search, woman: '1' })).map((item) => item.driver.id)).toEqual([2]);
    expect(await searchTrips(deps, { ...search, date: '2026-10-02' })).toEqual([]);
  });

  it('shows the woman mark set by the driver and hides trips that left', async () => {
    const { deps, trip, setNow } = setup();
    await publishTrip(deps, 1, { ...trip, womanOnBoard: true });
    const search = { from: '1726', to: '1718', date: '2026-10-01', woman: '1' as const };
    expect(await searchTrips(deps, search)).toHaveLength(1);
    setNow(NOW + 4 * HOUR);
    expect(await searchTrips(deps, search)).toEqual([]);
  });
});

describe('my trips and the end of a trip (docs/35)', () => {
  it('lets the driver cancel, and completes a trip after the road and 2 hours', async () => {
    const { deps, trip, setNow } = setup();
    const first = await publishTrip(deps, 1, trip);
    const second = await publishTrip(deps, 1, { ...trip, departAt: NOW + 30 * HOUR });
    const firstId = first.ok ? first.value.id : '';
    const secondId = second.ok ? second.value.id : '';
    expect(await cancelTrip(deps, 2, secondId)).toEqual({ ok: false, error: 'trips.not_found' });
    expect((await cancelTrip(deps, 1, secondId)).ok).toBe(true);
    expect(await cancelTrip(deps, 1, secondId)).toEqual({ ok: false, error: 'trips.wrong_status' });
    // 3 h to leave, 5 h on the road (300 km at 60 km/h), 2 h after arrival.
    setNow(NOW + 10 * HOUR);
    expect((await tripDetail(deps, firstId))?.status).toBe('completed');
    await deps.trips.completeOver(NOW + 10 * HOUR);
    expect((await myTrips(deps, 1)).map((item) => item.status)).toEqual(['cancelled', 'completed']);
    // The team sees every trip from yesterday on, cancelled ones too, the earliest first.
    expect((await teamTrips(deps)).map((item) => item.id)).toEqual([firstId, secondId]);
    setNow(NOW + 3 * 24 * HOUR);
    expect(await teamTrips(deps)).toEqual([]);
  });
});

describe('the meeting point from the driver bot (docs/14)', () => {
  it('saves a location sent as an answer to the trip message of this driver', async () => {
    const { deps, trip } = setup();
    const published = await publishTrip(deps, 1, trip);
    const id = published.ok ? published.value.id : '';
    expect(await setMeetingPoint(deps, 2, 77, { lat: 41.3, lng: 69.2 })).toBe('not_found');
    expect(await setMeetingPoint(deps, 1, 76, { lat: 41.3, lng: 69.2 })).toBe('not_found');
    expect(await setMeetingPoint(deps, 1, 77, { lat: 41.3, lng: 69.2 })).toBe('saved');
    expect((await tripDetail(deps, id))?.hasMeetingPoint).toBe(true);
  });
});
