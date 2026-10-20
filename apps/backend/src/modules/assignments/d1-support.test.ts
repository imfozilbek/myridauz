import { DAY_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { assign } from './application/assign';
import { d1Assignments } from './infrastructure/d1-assignments';

const DAY = '2026-10-02';
const MORNING = tashkentDayStart(DAY) + 9 * 60 * 60 * 1000;

function setup() {
  let now = MORNING;
  const store = d1Assignments(testD1());
  const deps = { store, teamIds: async () => [1, 2], now: () => now, random: () => 0.5 };
  const open = async () =>
    (await store.openSupport(tashkentDate(now - 2 * DAY_MS))).map((one) => one.subjectId);
  return { deps, store, open, later: (ms: number) => void (now += ms) };
}

// The questions of support in «Navbat» (G75, docs/158 К) in D1 (G89 A3).
describe('the support questions waiting for an answer', () => {
  it('come back when the person writes again after an answer on the same day', async () => {
    const { deps, store, open, later } = setup();
    await assign(deps, 'support', 101);
    await store.answered('support', 101, MORNING + 1);
    expect(await open()).toEqual([]);
    later(60_000);
    await assign(deps, 'support', 101);
    expect(await open()).toEqual([101]);
  });

  it('are all answered by one answer, the older days too', async () => {
    const { deps, store, open, later } = setup();
    await assign(deps, 'support', 101);
    later(DAY_MS);
    await assign(deps, 'support', 101);
    await store.answered('support', 101, MORNING + DAY_MS + 1);
    expect(await open()).toEqual([]);
  });
});
