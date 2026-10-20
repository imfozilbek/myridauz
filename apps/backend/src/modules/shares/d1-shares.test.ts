import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Shares } from './infrastructure/d1-shares';

const BOOKING = { kind: 'booking', id: 'b1' } as const;
const TRIP = { kind: 'trip', id: 't1' } as const;
const MOM = 501;
const SISTER = 502;

// The links of «Yaqinlarimga yuborish» in D1 (docs/43, G18, G49): a passenger's booking and a driver's
// trip each keep their own links and close people; every read goes by a key.
describe('the shares in D1', () => {
  it('keeps the link of a booking and of a trip apart, follows once, closes the link', async () => {
    const db = testD1();
    await db.exec('PRAGMA foreign_keys = OFF');
    const shares = d1Shares(db);
    await shares.save({ tokenHash: 'h1', subject: BOOKING, createdAt: 1, revokedAt: null });
    await shares.save({ tokenHash: 'h2', subject: TRIP, createdAt: 2, revokedAt: null });
    expect(await shares.find('h1')).toEqual({
      tokenHash: 'h1',
      subject: BOOKING,
      createdAt: 1,
      revokedAt: null,
    });
    expect((await shares.find('h2'))?.subject).toEqual(TRIP);
    expect(await shares.find('none')).toBeUndefined();
    await shares.follow(BOOKING, MOM, 3, 5);
    await shares.follow(BOOKING, MOM, 4, 5);
    await shares.follow(BOOKING, SISTER, 5, 5);
    await shares.follow(TRIP, MOM, 6, 5);
    expect(await shares.followers(BOOKING)).toEqual([MOM, SISTER]);
    await shares.revoke(BOOKING, 7);
    expect((await shares.find('h1'))?.revokedAt).toBe(7);
    expect(await shares.followers(BOOKING)).toEqual([]);
    expect(await shares.followers(TRIP)).toEqual([MOM]);
    // A deleted account follows no trip any more (docs/30).
    await shares.unfollowAll(MOM);
    expect(await shares.followers(TRIP)).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });

  // G89: two close people open the link in the same second: the limit holds, the sixth stays out.
  it('lets in only as many close people as the limit, at once too', async () => {
    const db = testD1();
    await db.exec('PRAGMA foreign_keys = OFF');
    const shares = d1Shares(db);
    for (const id of [1, 2, 3, 4]) await shares.follow(BOOKING, id, id, 5);
    const both = await Promise.all([shares.follow(BOOKING, MOM, 9, 5), shares.follow(BOOKING, SISTER, 9, 5)]);
    expect(both.sort()).toEqual([false, true]);
    expect(await shares.followers(BOOKING)).toHaveLength(5);
    expect(await shares.follow(BOOKING, 1, 10, 5)).toBe(true);
  });
});
