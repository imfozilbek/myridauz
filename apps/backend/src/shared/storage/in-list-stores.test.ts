import { describe, expect, it } from 'vitest';
import { d1Bookings } from '../../modules/bookings/infrastructure/d1-bookings';
import { d1Offers } from '../../modules/bookings/infrastructure/d1-offers';
import { d1Complaints } from '../../modules/complaints/infrastructure/d1-complaints';
import { d1Ratings } from '../../modules/ratings/infrastructure/d1-ratings';

const D1_BIND_LIMIT = 100;

// A D1 that refuses a query with more than 100 bound values, as the real one does.
const strictDb = () => {
  const statement = (values: unknown[]) => {
    if (values.length > D1_BIND_LIMIT) throw new Error('D1: too many SQL variables');
    return { all: async () => ({ results: [] }) };
  };
  const db = {
    prepare: () => ({ bind: (...values: unknown[]) => statement(values) }),
    batch: async (statements: unknown[]) => statements.map(() => ({ results: [] })),
  };
  return db as unknown as D1Database;
};

const ids = Array.from({ length: 250 }, (_, index) => `id-${index}`);
const people = Array.from({ length: 250 }, (_, index) => index + 1);

describe('queries with a list of ids survive 250 ids (docs/65 A2)', () => {
  it('reads bookings, offers, ratings and complaints for many trips and people', async () => {
    const db = strictDb();
    await expect(d1Bookings(db).byTrips(ids)).resolves.toEqual([]);
    await expect(d1Offers(db).byRequests(ids)).resolves.toEqual([]);
    await expect(d1Ratings(db).askedBookings(ids)).resolves.toEqual(new Set());
    await expect(d1Ratings(db).about(people)).resolves.toEqual([]);
    await expect(d1Ratings(db).writtenBy(people)).resolves.toEqual(new Set());
    await expect(d1Complaints(db).against(people, 0)).resolves.toEqual([]);
  });
});
