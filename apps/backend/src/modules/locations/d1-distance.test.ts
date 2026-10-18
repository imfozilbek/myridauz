import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Locations } from './infrastructure/d1-locations';

// The owner's corrections of a distance in D1 (G45, docs/48): the km before each one, read by the key.
describe('the corrections of a distance in D1', () => {
  it('keeps who, when, before and after, the newest first', async () => {
    const db = testD1();
    const store = d1Locations(db);
    // Two seeded districts of Toshkent and Samarqand: the migrations carry the directory.
    const pair = ['1718401', '1726273'] as const;
    const before = await store.distance(...pair);
    await store.correctDistance(...pair, { after: 310, by: 900, at: 1 });
    await store.correctDistance(...pair, { after: 305, by: 901, at: 2 });
    expect(await store.distance(...pair)).toBe(305);
    expect(await store.distanceChanges(...pair)).toEqual([
      { before: 310, after: 305, by: 901, at: 2 },
      { before: before ?? null, after: 310, by: 900, at: 1 },
    ]);
    expect(fullScans(db)).toEqual([]);
  });
});
