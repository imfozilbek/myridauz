import { describe, expect, it } from 'vitest';
import { arriveTrip, departTrip } from './application/progress';
import { publishTrip } from './application/publish';
import { cancelTrip, searchTrips, tripDetail } from './application/read';
import { HOUR, NOW, setup } from './test-kit';

const MINUTE = 60 * 1000;
const published = async (kit: ReturnType<typeof setup>) => {
  // 3 h to leave, 5 h on the road (300 km).
  const result = await publishTrip(kit.deps, 1, kit.trip);
  return result.ok ? result.value.id : '';
};

describe('«Yoʻlga chiqdim» and «Yetib keldik» (G63, docs/35)', () => {
  it('moves the own trip on the road and to the end, and the open screens refresh', async () => {
    const kit = setup();
    const { deps, setNow, ride, signals, events } = kit;
    const id = await published(kit);
    ride({ tripId: id, passengerId: 3, seats: 1, withWoman: false, pickup: null, dropoff: null });
    setNow(NOW + 2 * HOUR - MINUTE);
    expect(await departTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.too_early_to_depart' });
    expect(await arriveTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.not_departed' });
    expect(await departTrip(deps, 2, id)).toEqual({ ok: false, error: 'trips.not_found' });
    setNow(NOW + 2 * HOUR + 30 * MINUTE);
    const left = await departTrip(deps, 1, id);
    expect(left.ok && left.value).toMatchObject({
      departedAt: NOW + 2 * HOUR + 30 * MINUTE,
      arrivedAt: null,
    });
    expect(signals).toEqual(['driver 1', 'passenger 3']);
    expect(events).toContain(`departed ${id}`);
    expect(await departTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.already_departed' });
    setNow(NOW + 7 * HOUR);
    const home = await arriveTrip(deps, 1, id);
    expect(home.ok && home.value).toMatchObject({ arrivedAt: NOW + 7 * HOUR, status: 'active' });
    expect(signals.slice(2)).toEqual(['driver 1', 'passenger 3']);
    expect(await arriveTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.already_arrived' });
    expect(await tripDetail(deps, id)).toMatchObject({ departedAt: NOW + 2 * HOUR + 30 * MINUTE });
  });

  it('takes the time of the trip as the departure when the driver forgot the button', async () => {
    const kit = setup();
    const id = await published(kit);
    kit.setNow(NOW + 6 * HOUR);
    const home = await arriveTrip(kit.deps, 1, id);
    expect(home.ok && home.value).toMatchObject({ departedAt: NOW + 3 * HOUR, arrivedAt: NOW + 6 * HOUR });
  });

  it('hides a trip that left early from the search: nothing to book there', async () => {
    const kit = setup();
    const id = await published(kit);
    const search = { from: '1726', to: '1718', date: '2026-10-01' };
    kit.setNow(NOW + 2 * HOUR + 30 * MINUTE);
    expect((await searchTrips(kit.deps, search)).map((trip) => trip.id)).toEqual([id]);
    await departTrip(kit.deps, 1, id);
    expect(await searchTrips(kit.deps, search)).toEqual([]);
  });

  it('writes nothing when a cancel came first between the read and the write', async () => {
    const kit = setup();
    const id = await published(kit);
    const before = await kit.deps.trips.find(id);
    if (!before) throw new Error('no trip');
    await kit.deps.trips.save({ ...before, status: 'cancelled' });
    const stale = { ...kit.deps, trips: { ...kit.deps.trips, find: async () => before } };
    kit.setNow(NOW + 2 * HOUR + 30 * MINUTE);
    expect(await departTrip(stale, 1, id)).toEqual({ ok: false, error: 'trips.wrong_status' });
    expect(await kit.deps.trips.find(id)).toMatchObject({ status: 'cancelled', departedAt: null });
    expect(kit.signals).toEqual([]);
  });

  it('cancels nothing when «Yoʻlga chiqdim» came between the read and the write', async () => {
    const kit = setup();
    const id = await published(kit);
    const before = await kit.deps.trips.find(id);
    if (!before) throw new Error('no trip');
    kit.setNow(NOW + 2 * HOUR + 30 * MINUTE);
    await kit.deps.trips.depart(id, NOW + 2 * HOUR + 30 * MINUTE);
    const stale = { ...kit.deps, trips: { ...kit.deps.trips, find: async () => before } };
    expect(await cancelTrip(stale, 1, id)).toEqual({ ok: false, error: 'trips.wrong_status' });
    expect(await kit.deps.trips.find(id)).toMatchObject({ status: 'active' });
    expect(kit.events).toEqual([`published ${id}`]);
  });
});
