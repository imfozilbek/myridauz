import { DAY_MS, tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { assign } from './application/assign';
import { sendDigest, type DigestDeps, type DigestRow } from './application/digest';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

const DAY = '2026-10-02';
const MORNING = tashkentDayStart(DAY) + 9 * 60 * 60 * 1000;

function setup(team: number[]) {
  let now = MORNING;
  const sent: { day: string; rows: readonly DigestRow[] }[] = [];
  const deps: DigestDeps = {
    store: createMemoryAssignments(),
    teamIds: async () => team,
    now: () => (now += 1000),
    decisions: async () => new Map([[2, 4]]),
    send: async (day, rows) => void sent.push({ day, rows }),
  };
  return { deps, team, sent, at: (ms: number) => void (now = ms) };
}

describe('assignments (docs/92)', () => {
  it('shares the questions in turn, the same person stays with the same member that day', async () => {
    const { deps } = setup([1, 2]);
    expect(await assign(deps, 'support', 101)).toBe(1);
    expect(await assign(deps, 'support', 102)).toBe(2);
    expect(await assign(deps, 'support', 101)).toBe(1);
    // Applications count in the same work: 1 and 2 have one each, 1 waited longer.
    expect(await assign(deps, 'application', 201)).toBe(1);
    expect(await assign(deps, 'application', 202)).toBe(2);
  });

  it('a third member gets work from that moment; a member who left gets no more', async () => {
    const { deps, team } = setup([1, 2]);
    await assign(deps, 'support', 101);
    await assign(deps, 'support', 102);
    team.push(3);
    expect(await assign(deps, 'support', 103)).toBe(3);
    team.splice(0, 1);
    expect(await assign(deps, 'support', 101)).toBe(2);
    expect(await assign(deps, 'support', 104)).toBe(3);
  });

  it('a new day starts the same person from the least busy member again', async () => {
    const { deps, at } = setup([1, 2]);
    await assign(deps, 'support', 101);
    at(MORNING + DAY_MS);
    expect(await assign(deps, 'support', 101)).toBe(2);
  });

  it('nobody in the team: nobody is assigned', async () => {
    expect(await assign(setup([]).deps, 'support', 101)).toBeUndefined();
  });
});

describe('the daily digest (docs/92)', () => {
  it('after midnight sends the day before once: answered questions, decisions, members who left', async () => {
    const { deps, team, sent, at } = setup([1, 2]);
    await assign(deps, 'support', 101);
    await assign(deps, 'support', 102);
    await deps.store.answered('support', 101, MORNING);
    team.splice(1, 1, 3);
    at(tashkentDayStart(DAY) + DAY_MS + 60 * 1000);
    await sendDigest(deps);
    await sendDigest(deps);
    expect(sent).toEqual([
      {
        day: DAY,
        rows: [
          { memberId: 1, total: 1, answered: 1, applications: 0 },
          { memberId: 3, total: 0, answered: 0, applications: 0 },
          { memberId: 2, total: 1, answered: 0, applications: 4 },
        ],
      },
    ]);
  });

  it('waits for the night: in the daytime nothing is sent', async () => {
    const { deps, sent } = setup([1]);
    await sendDigest(deps);
    expect(sent).toEqual([]);
  });
});
