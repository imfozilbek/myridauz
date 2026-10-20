import { beforeEach, describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { NO_MARKS, type BookingRecord } from './domain/booking';
import { d1Bookings } from './infrastructure/d1-bookings';

// The guards of a seat in one SQL step each (G89): on SQLite with the real migrations.
const NOW = Date.parse('2026-10-20T01:00:00Z');
let db: D1Database;

beforeEach(async () => {
  db = testD1();
  await db.exec(`INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
    VALUES (1, 'Jasur', 'male', '998900000001', 0, 0, 0), (10, 'Dilnoza', 'female', '998900000010', 0, 0, 0)`);
  await db.exec(`INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ('t1', 1, '1726294', '1718401', ${NOW}, ${NOW}, 300, 3, 90000, 'active', 0)`);
});

const seat = (over: Partial<BookingRecord> = {}): BookingRecord => ({
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
  pickup: null,
  pickupNamed: null,
  dropoff: null,
  dropoffNamed: null,
  note: null,
  offerId: null,
  talkId: null,
  confirmedAt: null,
  boardedAt: null,
  arrivedAt: null,
  cameAt: null,
  ...NO_MARKS,
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

describe('the guards of a seat in D1 (G89)', () => {
  it('confirms no seat on a trip cancelled in the same second (T3)', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(seat());
    await db.exec(`UPDATE trips SET status = 'cancelled' WHERE id = 't1'`);
    expect(await bookings.confirmWithin(seat({ status: 'confirmed', confirmedAt: NOW }), 3)).toBe(false);
    expect((await bookings.find('b1'))?.status).toBe('requested');
  });

  it('forgets the confirmation of a seat that went back to a request (B4)', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(seat());
    expect(await bookings.confirmWithin(seat({ status: 'confirmed', confirmedAt: NOW }), 3)).toBe(true);
    expect(await bookings.replace(seat(), 'confirmed')).toBe(true);
    expect((await bookings.find('b1'))?.confirmedAt).toBeNull();
  });

  it('writes a step of the passenger once and never on a cancelled seat (B9)', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(seat({ status: 'confirmed', confirmedAt: NOW }));
    expect(await bookings.markStep('b1', 'came', NOW + 1)).toBe(true);
    expect(await bookings.markStep('b1', 'came', NOW + 2)).toBe(false);
    expect(
      await bookings.replace(seat({ status: 'cancelled_by_driver', confirmedAt: NOW }), 'confirmed'),
    ).toBe(true);
    expect(await bookings.markStep('b1', 'arrived', NOW + 3)).toBe(false);
    expect(await bookings.find('b1')).toMatchObject({
      status: 'cancelled_by_driver',
      cameAt: NOW + 1,
      arrivedAt: null,
    });
  });

  it('reads the seats cancelled after a confirmation since a time (M6)', async () => {
    const bookings = d1Bookings(db);
    await bookings.save(
      seat({ id: 'b1', status: 'cancelled_by_passenger', confirmedAt: NOW, updatedAt: NOW }),
    );
    await bookings.save(seat({ id: 'b2', status: 'cancelled_by_passenger', updatedAt: NOW }));
    await bookings.save(
      seat({ id: 'b3', status: 'cancelled_by_driver', confirmedAt: NOW, updatedAt: NOW - 10 }),
    );
    expect((await bookings.cancelledSince(NOW - 5)).map((found) => found.id)).toEqual(['b1']);
    expect(fullScans(db)).toEqual([]);
  });
});
