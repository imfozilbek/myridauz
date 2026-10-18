import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { askRatings } from './application/ask';
import { rate } from './application/rate';
import { reviewsOf, standingOf } from './application/read';
import { d1Ratings } from './infrastructure/d1-ratings';
import { DRIVER, HOUR, review, ride, setup } from './ratings-test-kit';

const D1 = async () => {
  const db = testD1();
  await db.exec('PRAGMA foreign_keys = OFF');
  return { db, store: d1Ratings(db) };
};

// The ratings over D1 (docs/24, G49): the same path as in memory, and every read goes by a key.
describe('the ratings in D1', () => {
  it('asks once and reminds once, keeps reviews blind, hides one, forgets a deleted person', async () => {
    const { db, store } = await D1();
    const { deps, asked, later } = setup([ride(1), ride(2)], store);
    await askRatings(deps);
    await askRatings(deps);
    expect(asked).toHaveLength(4);
    await rate(deps, 101, { ...review('b1', 4, 'Yaxshi'), tags: ['on_time'] });
    later(25 * HOUR);
    await askRatings(deps);
    // Only the sides who never rated hear the reminder.
    expect(asked.slice(4).map((item) => [item.ask.raterId, item.reminder])).toEqual([
      [DRIVER, true],
      [102, true],
      [DRIVER, true],
    ]);
    expect((await reviewsOf(deps, DRIVER)).reviews).toEqual([]);
    await rate(deps, DRIVER, review('b1', 5));
    await rate(deps, 102, review('b2', 3));
    later(7 * DAY_MS);
    const shown = (await reviewsOf(deps, DRIVER)).reviews;
    expect(shown.map((item) => [item.stars, item.text])).toEqual([
      [3, ''],
      [4, 'Yaxshi'],
    ]);
    expect(await store.hide(shown[0]?.id ?? '')).toBe(true);
    expect(await store.hide('none')).toBe(false);
    expect((await reviewsOf(deps, DRIVER)).reviews).toHaveLength(1);
    expect((await store.by(101)).map((item) => item.bookingId)).toEqual(['b1']);
    expect(await store.writtenBy([101, 102])).toEqual(new Set(['b1:101', 'b2:102']));
    expect(await store.flag(DRIVER, 1)).toBe(true);
    expect(await store.flag(DRIVER, 2)).toBe(false);
    // A deleted account: the reviews it wrote and the reviews about it go (docs/65 A5).
    await store.forget(DRIVER);
    expect(await standingOf(deps, DRIVER)).toEqual({ rating: { average: null, count: 0 }, onTime: null });
    expect(await store.by(101)).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });
});
