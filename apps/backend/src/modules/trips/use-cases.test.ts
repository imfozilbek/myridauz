import { describe, expect, it } from 'vitest';
import { familyView } from './application/driver-trips';
import { publishTrip } from './application/publish';
import { cancelTrip, myTrips, searchTrips, tripDetail } from './application/read';
import { HOUR, NOW, setup } from './test-kit';
import { publicIdOf } from '../../test-people';

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

  it('hides phones and links in the comment: every searcher reads it (docs/07)', async () => {
    const { deps, trip } = setup();
    const published = await publishTrip(deps, 1, { ...trip, comment: 'tel 90 123 45 67, @ali_uz' });
    const comment = published.ok ? published.value.comment : '';
    expect(comment).not.toMatch(/123|ali_uz/);
    expect((await tripDetail(deps, published.ok ? published.value.id : ''))?.comment).toBe(comment);
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

describe('a driver on a new check (docs/65 A1)', () => {
  it('keeps his trips with the approved car in search, detail, his list and the family view', async () => {
    const { deps, trip, recheck } = setup();
    const published = await publishTrip(deps, 1, trip);
    const id = published.ok ? published.value.id : '';
    recheck(1);
    const search = { from: '1726273', to: '1718401', date: '2026-10-01' };
    expect((await searchTrips(deps, search)).map((item) => item.id)).toEqual([id]);
    expect((await tripDetail(deps, id))?.driver.car.model).toBe('Cobalt');
    expect((await myTrips(deps, 1)).map((item) => item.id)).toEqual([id]);
    expect((await familyView(deps, id))?.plate).toBe('01A123BC');
    // Only a new trip waits for the team.
    expect(await publishTrip(deps, 1, trip)).toEqual({ ok: false, error: 'trips.not_driver' });
  });
});

describe('finding trips (docs/06, docs/14)', () => {
  it('finds by a place or a region, the whole of Tashkent for any district, and filters "ayol bor"', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, trip);
    await publishTrip(deps, 2, { ...trip, to: '1718233', departAt: NOW + 5 * HOUR });
    const search = { from: '1726294', to: '1718', date: '2026-10-01' };
    const drivers = async (query: typeof search & { woman?: '1' }) =>
      (await searchTrips(deps, query)).map((item) => item.driver.id);
    expect(await drivers(search)).toEqual([publicIdOf(1), publicIdOf(2)]);
    expect(await drivers({ ...search, to: '1718401' })).toEqual([publicIdOf(1)]);
    expect(await drivers({ ...search, woman: '1' })).toEqual([publicIdOf(2)]);
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

  it('adds "ayol bor" for a woman with a confirmed booking and hides a full trip (G08)', async () => {
    const { deps, trip, ride } = setup();
    const published = await publishTrip(deps, 1, trip);
    const tripId = published.ok ? published.value.id : '';
    const search = { from: '1726', to: '1718', date: '2026-10-01', woman: '1' as const };
    expect(await searchTrips(deps, search)).toEqual([]);
    // Passenger 2 is a woman: her confirmed booking gives the mark, only the fact (docs/06).
    ride({ tripId, passengerId: 2, seats: 1, pickup: null, dropoff: null });
    expect(await searchTrips(deps, search)).toMatchObject([{ woman: true, seatsLeft: 2, status: 'active' }]);
    ride({ tripId, passengerId: 3, seats: 2, pickup: null, dropoff: null });
    expect(await tripDetail(deps, tripId)).toMatchObject({ seatsLeft: 0, status: 'full' });
    expect(await searchTrips(deps, { ...search, woman: undefined })).toEqual([]);
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
  });
});

describe('the way a driver picks people up (G24, docs/70)', () => {
  it('shows the pitak of the direction unless the driver takes people only at the door', async () => {
    const { deps, trip } = setup();
    const both = await publishTrip(deps, 1, trip);
    expect(both.ok && both.value).toMatchObject({ pickupMode: 'both', pitak: { id: 'toshkent-avtovokzal' } });
    const door = await publishTrip(deps, 1, { ...trip, pickupMode: 'door' });
    expect(door.ok && door.value).toMatchObject({ pickupMode: 'door', pitak: null });
  });
});
