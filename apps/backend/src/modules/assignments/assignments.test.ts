import { DAY_MS, tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { assign } from './application/assign';
import { sendDigest, type DigestDeps, type DigestRow } from './application/digest';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

const DAY = '2026-10-02';
const MORNING = tashkentDayStart(DAY) + 9 * 60 * 60 * 1000;

function setup(team: number[]) {
  let now = MORNING;
  const sent: { day: string; rows: readonly DigestRow[]; people: number }[] = [];
  const deps: DigestDeps = {
    store: createMemoryAssignments(),
    teamIds: async () => team,
    now: () => (now += 1000),
    random: () => 0.5,
    decisions: async () => new Map([[2, 4]]),
    numbers: async () => ({ newUsers: 24, trips: 17, bookings: 41, fromChannels: 31 }),
    send: async (day, rows, numbers) => void sent.push({ day, rows, people: numbers.newUsers }),
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

// The summary of the day to the owner at 21:00 (G68, docs/122), instead of the digest after midnight.
describe('the summary of the day (docs/92, docs/122)', () => {
  it('at 21:00 sends the day once: numbers, answered questions, decisions, members who left', async () => {
    const { deps, team, sent, at } = setup([1, 2]);
    await assign(deps, 'support', 101);
    await assign(deps, 'support', 102);
    await deps.store.answered('support', 101, MORNING);
    team.splice(1, 1, 3);
    at(tashkentDayStart(DAY) + 21 * 60 * 60 * 1000 + 60 * 1000);
    await sendDigest(deps);
    await sendDigest(deps);
    expect(sent).toEqual([
      {
        day: DAY,
        people: 24,
        rows: [
          { memberId: 1, total: 1, answered: 1, applications: 0 },
          { memberId: 3, total: 0, answered: 0, applications: 0 },
          { memberId: 2, total: 1, answered: 0, applications: 4 },
        ],
      },
    ]);
  });

  it('waits for 21:00: in the daytime nothing is sent', async () => {
    const { deps, sent } = setup([1]);
    await sendDigest(deps);
    expect(sent).toEqual([]);
  });
});
