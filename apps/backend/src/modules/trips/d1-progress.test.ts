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
    const ids = async () => (await trips.notDeparted(NOW - 2 * HOUR, NOW - HOUR)).map((found) => found.id);
    expect((await ids()).sort()).toEqual(['full', 'late']);
    await trips.depart('late', NOW);
    expect(await ids()).toEqual(['full']);
    await trips.leaving(NOW, NOW + HOUR, ['1726273']);
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
});
