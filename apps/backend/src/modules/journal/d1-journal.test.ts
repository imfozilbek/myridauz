import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Journal } from './infrastructure/d1-journal';
import { workOf } from './domain/work';

const NOW = Date.parse('2026-10-12T05:00:00Z');
const MINUTE = 60 * 1000;
const HOURS = { from: 7, to: 23 };
const decision = (memberId: number, at: number, since: number | null) =>
  ({ memberId, kind: 'face', subject: 's', action: 'approve', since, at }) as const;

// The journal of the team on SQLite with the real migrations (G75, migration 0057).
describe('the journal of the team in D1', () => {
  it('gives the newest first and the day of a member, never scanning the table', async () => {
    const db = testD1();
    const journal = d1Journal(db);
    await journal.add(decision(7, NOW - 50 * MINUTE, NOW - 60 * MINUTE));
    await journal.add(decision(8, NOW - 20 * MINUTE, null));
    await journal.add(decision(7, NOW - 10 * MINUTE, NOW - 50 * MINUTE));
    expect((await journal.recent(NOW, 2)).map((action) => action.at)).toEqual([
      NOW - 10 * MINUTE,
      NOW - 20 * MINUTE,
    ]);
    const day = await journal.ofMember(7, NOW - 60 * MINUTE, NOW);
    expect(workOf(day, HOURS, 30)).toEqual({ done: 2, averageMinutes: 25, over: 1 });
    expect(fullScans(db)).toEqual([]);
  });
});
