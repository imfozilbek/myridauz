import { describe, expect, it } from 'vitest';
import { remindCases, type WaitingCase } from './application/remind-cases';
import { fullScans, testD1 } from '../../test-d1';
import { d1Assignments } from './infrastructure/d1-assignments';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

// 2026-10-02 10:00 in Tashkent: team hours, every minute counts.
const MORNING = Date.parse('2026-10-02T05:00:00Z');
const MINUTE = 60_000;
const HOURS = { from: 8, to: 22 };
const QUESTION: WaitingCase = { kind: 'support', id: 'p1', name: 'Ali', since: MORNING };

function setup(assignee: number | undefined) {
  let now = MORNING;
  const heard: string[] = [];
  const store = createMemoryAssignments();
  const deps = {
    rules: { hours: HOURS, remindMinutes: 25, ownerMinutes: 30 },
    now: () => now,
    cases: async () => [QUESTION],
    assigneeOf: async () => assignee,
    teamIds: async () => [1, 2, 3],
    mark: (item: WaitingCase, step: 'moderator' | 'owner', at: number) =>
      store.markCase(item.kind, item.id, item.since, step, at),
    toMembers: async (ids: readonly number[]) => void heard.push(`members ${ids.join(',')}`),
    toOwners: async (_item: WaitingCase, moderator: number | undefined) =>
      void heard.push(`owners ${String(moderator)}`),
  };
  const run = async (minutes: number) => {
    now = MORNING + minutes * MINUTE;
    await remindCases(deps);
  };
  return { heard, run };
}

// G89 A5: a support question rings the member it was given to; a member who left the team does not
// keep it silent: the whole team hears it.
describe('the reminders of a support question', () => {
  it('ring its member at 25 minutes and the owners at 30 with the name, once each', async () => {
    const { heard, run } = setup(2);
    for (const minutes of [10, 25, 26, 30, 45]) await run(minutes);
    expect(heard).toEqual(['members 2', 'owners 2']);
  });

  it('ring the whole team when its member left', async () => {
    const { heard, run } = setup(9);
    await run(30);
    expect(heard).toEqual(['members 1,2,3', 'owners undefined']);
  });
});

describe('the marks of the reminders in D1', () => {
  it('let each step of a case go once, by the key', async () => {
    const db = testD1();
    const store = d1Assignments(db);
    expect(await store.markCase('face', 'p1', MORNING, 'owner', MORNING)).toBe(true);
    expect(await store.markCase('face', 'p1', MORNING, 'owner', MORNING + MINUTE)).toBe(false);
    // A new photo of the same person is a new case.
    expect(await store.markCase('face', 'p1', MORNING + MINUTE, 'owner', MORNING + MINUTE)).toBe(true);
    expect(fullScans(db)).toEqual([]);
  });
});
