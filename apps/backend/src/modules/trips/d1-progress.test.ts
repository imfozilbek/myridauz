import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Trips } from './infrastructure/d1-trips';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-05T05:00:00Z');
const trip = (id: string, departAt: number, status = 'active') =>
  `('${id}', 1, '1726273', '1718401', ${departAt}, ${departAt + 7 * HOUR}, 300, 3, 90000, '${status}', 0)`;

async function seeded() {
  const db = testD1();
  await db.exec(`PRAGMA foreign_keys = OFF;
    INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ${[
      trip('soon', NOW + HOUR / 2),
      trip('late', NOW - 90 * 60 * 1000),
      trip('cancelled', NOW - HOUR, 'cancelled'),
      trip('full', NOW - 2 * HOUR, 'full'),
    ].join(', ')}`);
  return { db, trips: d1Trips(db) };
}

// The marks of the road in D1 (G63, migration 0046): conditional writes, read through an index.
describe('«Yoʻlga chiqdim» and «Yetib keldik» in D1', () => {
  it('writes the departure once, never on a cancelled trip', async () => {
    const { trips } = await seeded();
    expect(await trips.depart('soon', NOW)).toBe(true);
    expect(await trips.depart('soon', NOW + 1)).toBe(false);
    expect(await trips.depart('cancelled', NOW)).toBe(false);
    expect(await trips.find('soon')).toMatchObject({ departedAt: NOW, arrivedAt: null });
    expect(await trips.find('cancelled')).toMatchObject({ departedAt: null, status: 'cancelled' });
  });

  it('writes the arrival once, only on the road, with the time of the trip as the departure', async () => {
    const { trips } = await seeded();
    expect(await trips.arrive('soon', NOW)).toBe(false);
    expect(await trips.arrive('late', NOW)).toBe(true);
    expect(await trips.find('late')).toMatchObject({ departedAt: NOW - 90 * 60 * 1000, arrivedAt: NOW });
    expect(await trips.arrive('late', NOW + 1)).toBe(false);
    expect(await trips.depart('late', NOW + 1)).toBe(false);
  });

  it('finds the live trips without a departure in the window, through an index', async () => {
    const { db, trips } = await seeded();
    const ids = async () =>
      (await trips.notDeparted(NOW - 2 * HOUR, NOW - HOUR, 3 * HOUR)).map((found) => found.id);
    expect((await ids()).sort()).toEqual(['full', 'late']);
    await trips.depart('late', NOW);
    expect(await ids()).toEqual(['full']);
    await trips.leaving(NOW, NOW + HOUR, ['1726273']);
    expect(fullScans(db)).toEqual([]);
  });

  // A range (G90, docs/216): the Cron counts from its end, the arrival takes the end as the departure.
  it('takes a range by its end', async () => {
    const { db, trips } = await seeded();
    await db.exec(`INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, depart_until, ends_at, km,
      seats, price, status, created_at) VALUES ('range', 1, '1726273', '1718401', ${NOW - 4 * HOUR},
      ${NOW - 90 * 60 * 1000}, ${NOW + 7 * HOUR}, 300, 3, 90000, 'active', 0), ('wide', 1, '1726273',
      '1718401', ${NOW - 2 * HOUR}, ${NOW}, ${NOW + 7 * HOUR}, 300, 3, 90000, 'active', 0)`);
    const ids = await trips.notDeparted(NOW - 2 * HOUR, NOW - HOUR, 3 * HOUR);
    expect(ids.map((found) => found.id).sort()).toEqual(['full', 'late', 'range']);
    expect(await trips.arrive('wide', NOW - HOUR)).toBe(false);
    expect(await trips.arrive('range', NOW)).toBe(true);
    expect(await trips.find('range')).toMatchObject({ departedAt: NOW - 90 * 60 * 1000 });
    expect(fullScans(db)).toEqual([]);
  });

  it('hides a trip that left early from the search', async () => {
    const { trips } = await seeded();
    expect((await trips.leaving(NOW, NOW + HOUR, ['1726273'])).map((found) => found.id)).toEqual(['soon']);
    await trips.depart('soon', NOW);
    expect(await trips.leaving(NOW, NOW + HOUR, ['1726273'])).toEqual([]);
  });

  it('cancels only a live trip that has not left: one conditional write', async () => {
    const { trips } = await seeded();
    await trips.depart('late', NOW);
    expect(await trips.cancel('late')).toBe(false);
    expect(await trips.cancel('soon')).toBe(true);
    expect(await trips.cancel('soon')).toBe(false);
    expect(await trips.find('soon')).toMatchObject({ status: 'cancelled' });
    expect(await trips.find('late')).toMatchObject({ status: 'active' });
  });

  // G89 T7: a change read before the cancel or the departure never brings the trip back.
  it('changes only a live trip that has not left, never its status or marks', async () => {
    const { trips } = await seeded();
    const stale = await trips.find('soon');
    const left = await trips.find('late');
    if (!stale || !left) throw new Error('no trip');
    await trips.cancel('soon');
    await trips.depart('late', NOW);
    expect(await trips.save({ ...stale, price: 80000 })).toBe(false);
    expect(await trips.save({ ...left, price: 80000 })).toBe(false);
    expect(await trips.find('soon')).toMatchObject({ status: 'cancelled', price: 90000 });
    expect(await trips.find('late')).toMatchObject({ departedAt: NOW, price: 90000 });
    expect(await trips.save({ ...stale, id: 'new', pitakId: 'p1' })).toBe(true);
    expect(await trips.save({ ...stale, id: 'new', price: 80000 })).toBe(true);
    // The pitak of the publishing stays with the trip (G89 T8).
    expect(await trips.find('new')).toMatchObject({ status: 'active', price: 80000, pitakId: 'p1' });
  });

  // G89 T2: the hourly repair reads the cancelled trips of two days back and ahead, through an index.
  it('reads the cancelled trips leaving after a time', async () => {
    const { db, trips } = await seeded();
    expect(await trips.cancelledAfter(NOW - 2 * HOUR)).toEqual(['cancelled']);
    expect(await trips.cancelledAfter(NOW)).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });
});
