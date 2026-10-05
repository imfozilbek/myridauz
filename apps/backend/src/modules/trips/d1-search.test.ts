import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Trips } from './infrastructure/d1-trips';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-05T05:00:00Z');
const trip = (id: string, from: string, departAt: number, status = 'active') =>
  `('${id}', 1, '${from}', '1718401', ${departAt}, ${departAt + HOUR}, 300, 3, 90000, '${status}', 0)`;

// A search reads only the trips from its places, through trips_from, not every trip of the day (G56).
describe('the search of trips in D1', () => {
  it('reads the trips from the places of the search, the earliest first', async () => {
    const db = testD1();
    await db.exec(`PRAGMA foreign_keys = OFF;
      INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
      VALUES ${[
        trip('late', '1726273', NOW + 3 * HOUR),
        trip('early', '1726294', NOW + HOUR),
        trip('other', '1703', NOW + HOUR),
        trip('full', '1726273', NOW + HOUR, 'full'),
        trip('tomorrow', '1726273', NOW + 30 * HOUR),
      ].join(', ')}`);
    const found = await d1Trips(db).leaving(NOW, NOW + 24 * HOUR, ['1726273', '1726294']);
    expect(found.map((item) => item.id)).toEqual(['early', 'late']);
    expect(fullScans(db)).toEqual([]);
  });
});
