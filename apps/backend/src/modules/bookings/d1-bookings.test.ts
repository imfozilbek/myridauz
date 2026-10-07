import { beforeEach, describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { withoutPoints, type BookingRecord } from './domain/booking';
import { d1Bookings } from './infrastructure/d1-bookings';

// The SQL of the bookings on SQLite with the real migrations (G24, docs/69).
const NOW = Date.parse('2026-10-01T01:00:00Z');
const NAMED = {
  name: { step: 'mahalla', name: 'Qatortol' },
  area: { step: 'district', name: 'Chilonzor' },
} as const;
let db: D1Database;

async function seed() {
  await db.exec(`INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
    VALUES (1, 'Jasur', 'male', '998900000001', 0, 0, 0), (10, 'Dilnoza', 'female', '998900000010', 0, 0, 0)`);
  await db.exec(`INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ('t1', 1, '1726294', '1718401', ${NOW}, ${NOW}, 300, 3, 90000, 'active', 0)`);
}

const record = (over: Partial<BookingRecord> = {}): BookingRecord => ({
  id: 'b1',
  tripId: 't1',
  passengerId: 10,
  seats: 1,
  wholeCar: false,
  withWoman: false,
  price: 90_000,
  commission: 9000,
  status: 'requested',
  expiresAt: NOW + 1000,
  mode: 'door',
  pitakId: null,
  pickup: { lat: 41.2856, lng: 69.2045 },
  pickupNamed: NAMED,
  dropoff: { lat: 39.6547, lng: 66.9758 },
  dropoffNamed: { name: null, area: null },
  offerId: null,
  confirmedAt: null,
  boardedAt: null,
  arrivedAt: null,
  cameAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

beforeEach(async () => {
  db = testD1();
  await seed();
});

describe('bookings in D1 (G24)', () => {
  it('keeps the way, the pitak, the points and their names', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(record({ mode: 'pitak', pitakId: 'p1' }));
    expect(await bookings.find('b1')).toEqual(record({ mode: 'pitak', pitakId: 'p1' }));
  });

  it('keeps the time of the confirmation (docs/88 L6)', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(record());
    const confirmed = record({ status: 'confirmed', confirmedAt: NOW + 7, updatedAt: NOW + 7 });
    expect(await bookings.confirmWithin(confirmed, 3)).toBe(true);
    expect((await bookings.find('b1'))?.confirmedAt).toBe(NOW + 7);
  });

  it('erases the points with the status in one step, and by id, person and age', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(record());
    const cancelled = withoutPoints({ ...record(), status: 'cancelled_by_passenger' });
    expect(await bookings.replace(cancelled, 'requested')).toBe(true);
    expect(await bookings.find('b1')).toEqual(cancelled);
    await bookings.save(record({ id: 'b2', status: 'confirmed' }));
    await bookings.save(record({ id: 'b3', status: 'confirmed', createdAt: NOW + 5 }));
    expect(await bookings.keepingPoints(NOW + 1)).toEqual([{ id: 'b2', tripId: 't1' }]);
    await bookings.erasePoints(['b2']);
    expect((await bookings.find('b2'))?.pickup).toBeNull();
    await bookings.erasePointsOf(10);
    expect(await bookings.keepingPoints(NOW + 10)).toEqual([]);
  });

  it('expires a request without an answer and erases its points', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(record());
    const expired = withoutPoints({ ...record(), status: 'expired' as const, updatedAt: NOW + 1000 });
    // The expired ones come back once: the passenger is told about each (docs/83 N03).
    expect(await bookings.expireOver(NOW + 1000)).toEqual([expired]);
    expect(await bookings.find('b1')).toEqual(expired);
    expect(await bookings.expireOver(NOW + 2000)).toEqual([]);
  });
});
