import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { d1Trips } from './infrastructure/d1-trips';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-11-06T05:00:00Z');
const SEEN = { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '01A777BC' } as const;
const trip = (id: string, departAt: number, status = 'active', departedAt: number | null = null) =>
  `('${id}', 1, '1726273', '1718401', ${departAt}, ${departAt + 7 * HOUR}, 300, 3, 90000, '${status}', 0,
    'Chevrolet', 'Cobalt', 'white', '01A123BC', ${departedAt ?? 'NULL'})`;

// G95 (docs/224) in D1: the car the team fixed by its photo is written into a trip not on the way.
describe('the fixed car of a trip in D1', () => {
  it('goes into a live trip before its departure only', async () => {
    const db = testD1();
    await db.exec(`PRAGMA foreign_keys = OFF;
      INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at,
        car_make, car_model, car_color, car_plate, departed_at)
      VALUES ${[
        trip('soon', NOW + HOUR),
        trip('left', NOW + HOUR, 'active', NOW),
        trip('late', NOW - HOUR),
        trip('cancelled', NOW + HOUR, 'cancelled'),
      ].join(', ')}`);
    const trips = d1Trips(db);
    const plateOf = async (id: string) => (await trips.find(id))?.car?.plate;
    expect(await trips.fixCar('soon', SEEN, NOW)).toBe(true);
    expect(await trips.find('soon')).toMatchObject({ car: SEEN });
    for (const id of ['left', 'late', 'cancelled']) {
      expect(await trips.fixCar(id, SEEN, NOW)).toBe(false);
      expect(await plateOf(id)).toBe('01A123BC');
    }
  });
});
