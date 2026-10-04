import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { d1Numbers } from './infrastructure/d1-numbers';

// The main numbers on SQLite with the real migrations (docs/29, G53).
const NOW = Date.parse('2026-10-04T10:00:00Z');
const HOUR = 60 * 60 * 1000;
let db: D1Database;

const trip = (id: string, departAt: number, status: string) =>
  `('${id}', 1, '1726294', '1718401', ${departAt}, ${departAt + HOUR}, 300, 3, 90000, '${status}', ${NOW - HOUR})`;

beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  db = testD1();
  await db.exec(`INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
    VALUES (1, 'Jasur', 'male', '998900000001', 0, 0, 0)`);
});

describe('the main numbers (docs/29)', () => {
  it('counts as live only the trips people can book now (G53)', async () => {
    await db.exec(`INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
      VALUES ${[
        trip('t1', NOW + HOUR, 'active'),
        trip('t2', NOW + 2 * HOUR, 'full'),
        trip('t3', NOW - HOUR, 'active'),
        trip('t4', NOW + HOUR, 'cancelled'),
      ].join(', ')}`);
    const numbers = await d1Numbers(db).numbers(NOW - 24 * HOUR);
    expect(numbers.activeTrips).toBe(2);
    expect(numbers.trips).toBe(4);
    vi.useRealTimers();
  });
});
