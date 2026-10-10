import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Takes } from './infrastructure/d1-takes';

const NOW = Date.parse('2026-10-12T05:00:00Z');
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// «Aziz koʻrmoqda» on SQLite with the real migrations (G75, migration 0056).
describe('who opened a case of «Navbat» in D1', () => {
  it('keeps the last opening of a case, reads the fresh ones, forgets a day ago, never scans', async () => {
    const db = testD1();
    const takes = d1Takes(db);
    await takes.take({ kind: 'face', id: 'old', memberId: 7 }, NOW - 2 * DAY);
    await takes.take({ kind: 'application', id: 'p1', memberId: 7 }, NOW - 20 * MINUTE);
    await takes.take({ kind: 'application', id: 'p1', memberId: 8 }, NOW - 2 * MINUTE);
    await takes.take({ kind: 'complaint', id: 'c1', memberId: 7 }, NOW - MINUTE);
    expect(await takes.fresh(NOW - 10 * MINUTE)).toEqual([
      { kind: 'application', id: 'p1', memberId: 8 },
      { kind: 'complaint', id: 'c1', memberId: 7 },
    ]);
    expect(await takes.fresh(0)).not.toContainEqual({ kind: 'face', id: 'old', memberId: 7 });
    expect(fullScans(db)).toEqual([]);
  });
});
