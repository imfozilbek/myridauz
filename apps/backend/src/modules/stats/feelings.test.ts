import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { feelingsOf } from './domain/feelings';
import { d1Numbers } from './infrastructure/d1-numbers';

const NOW = Date.parse('2026-10-18T10:00:00Z');
const DAY = 86_400_000;

// G87 V2 (docs/191): what the reviews and complaints of a period say, numbers only.
describe('the feelings of a period', () => {
  it('sums the stars, the 1 and 2 stars, the tags and the reasons of the period through indexes', async () => {
    const db = testD1();
    const review = (id: string, stars: number, tags: string[], at: number) =>
      db
        .prepare(
          'INSERT INTO reviews (id, booking_id, rater_id, ratee_id, stars, tags, created_at, updated_at) VALUES (?, ?, 1, 2, ?, ?, ?, ?)',
        )
        .bind(id, `b-${id}`, stars, JSON.stringify(tags), at, at)
        .run();
    await review('r1', 5, ['on_time', 'polite'], NOW - 1000);
    await review('r2', 4, ['on_time'], NOW - 2000);
    await review('r3', 1, [], NOW - 3000);
    await review('old', 1, ['tidy'], NOW - 3 * DAY);
    const complaint = (id: string, reason: string, at: number) =>
      db
        .prepare(
          "INSERT INTO complaints (id, author_id, against_id, booking_id, reason, status, created_at) VALUES (?, 1, 2, ?, ?, 'new', ?)",
        )
        .bind(id, `b-${id}`, reason, at)
        .run();
    await complaint('c1', 'no_show,price_changed', NOW - 1000);
    await complaint('c2', 'no_show', NOW - 2000);
    const rows = await d1Numbers(db).feelings(NOW - DAY);
    expect(feelingsOf(rows)).toEqual({
      reviews: 3,
      average: 3.3,
      lowShare: 33,
      tags: [
        { tag: 'on_time', count: 2 },
        { tag: 'polite', count: 1 },
      ],
      reasons: [
        { reason: 'no_show', count: 2 },
        { reason: 'price_changed', count: 1 },
      ],
    });
    expect(fullScans(db)).toEqual([]);
  });

  it('says nothing without reviews', () => {
    expect(feelingsOf({ reviews: 0, starsSum: 0, low: 0, tags: [], reasons: [] })).toEqual({
      reviews: 0,
      average: null,
      lowShare: 0,
      tags: [],
      reasons: [],
    });
  });
});
