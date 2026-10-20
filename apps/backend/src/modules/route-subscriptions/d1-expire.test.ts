import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import type { SubscriptionRecord } from './domain/subscription';
import { d1Subscriptions } from './infrastructure/subscription-store';

const ANY_DATE: SubscriptionRecord = {
  id: 's1',
  userId: 1,
  kind: 'trips',
  from: '1726',
  to: '1718',
  date: null,
  woman: false,
  expiresAt: 10,
  expired: false,
  createdAt: 1,
};

// G89: the hourly job marks a subscription expired only if its time is still the one it read.
describe('the end of a subscription in D1', () => {
  it('keeps a renewal of the same moment and marks once', async () => {
    const db = testD1();
    await db.exec('PRAGMA foreign_keys = OFF');
    const store = d1Subscriptions(db);
    await store.save(ANY_DATE);
    await store.save({ ...ANY_DATE, expiresAt: 99 });
    expect(await store.expire(ANY_DATE)).toBe(false);
    expect(await store.expire({ ...ANY_DATE, expiresAt: 99 })).toBe(true);
    expect(await store.expire({ ...ANY_DATE, expiresAt: 99 })).toBe(false);
    expect((await store.find('s1'))?.expired).toBe(true);
    expect(fullScans(db)).toEqual([]);
  });
});
