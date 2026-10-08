import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { createMemoryTripViews, d1TripViews } from './infrastructure/trip-views';

const NOW = Date.parse('2026-10-08T05:00:00Z');

describe.each([
  ['D1', () => d1TripViews(testD1())],
  ['memory', createMemoryTripViews],
])('the people who opened a trip, in %s (G63)', (_store, make) => {
  it('keeps one row per person and trip, and forgets a deleted person (docs/30)', async () => {
    const views = make();
    const opens = [
      ['t1', 1],
      ['t1', 1],
      ['t1', 2],
      ['t2', 1],
    ] as const;
    for (const [trip, person] of opens) await views.record(trip, person, NOW);
    expect([await views.count('t1'), await views.count('t2'), await views.count('t3')]).toEqual([2, 1, 0]);
    await views.forget(1);
    expect([await views.count('t1'), await views.count('t2')]).toEqual([1, 0]);
  });
});

describe('the views in D1 and the free plan (docs/117)', () => {
  it('writes, counts and forgets through the keys, never reading the table whole', async () => {
    const db = testD1();
    const views = d1TripViews(db);
    await views.record('t1', 1, NOW);
    await views.count('t1');
    await views.forget(1);
    expect(fullScans(db)).toEqual([]);
  });

  // D1 counts every index entry as a row written: the key is the table itself (WITHOUT ROWID), so a
  // first view writes 2 rows (the table and trip_views_user), not 3.
  it('keeps the views in their key, with no rowid of their own', async () => {
    await expect(testD1().prepare('SELECT rowid FROM trip_views').all()).rejects.toThrow();
  });
});
