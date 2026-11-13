import { DAY_MS, HOUR_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { isTipTime, pickTips } from './domain/tip-rules';
import { windowsOf } from './domain/tip-windows';

// 12:00 in Tashkent.
const NOON = Date.UTC(2026, 9, 5, 7);

// G70a (docs/123 §3, docs/232): the rules of the tips of a step.
describe('the rules of the tips', () => {
  it('go only from 10:00 to 20:00 in Tashkent', () => {
    expect(isTipTime(NOON - 2 * HOUR_MS)).toBe(true);
    expect(isTipTime(NOON - 2 * HOUR_MS - 1)).toBe(false);
    expect(isTipTime(NOON + 8 * HOUR_MS - 1)).toBe(true);
    expect(isTipTime(NOON + 8 * HOUR_MS)).toBe(false);
  });

  it('tell a person once a run and a week, a step at most twice', () => {
    const stopped = [
      { userId: 1, step: 'p2' as const },
      { userId: 1, step: 'p3' as const },
      { userId: 2, step: 'p2' as const },
      { userId: 3, step: 'd1' as const },
      { userId: 3, step: 'd2' as const },
    ];
    const journal = [
      { userId: 2, step: 'p3' as const, sentAt: NOON - 6 * DAY_MS },
      { userId: 3, step: 'd1' as const, sentAt: NOON - 20 * DAY_MS },
      { userId: 3, step: 'd1' as const, sentAt: NOON - 10 * DAY_MS },
    ];
    expect(pickTips(stopped, journal, NOON)).toEqual([stopped[0], stopped[4]]);
  });

  it('read a day of stops after the delay, and a week before for a second tip', () => {
    expect(windowsOf('p3', NOON)).toEqual([{ from: NOON - 27 * HOUR_MS, to: NOON - 3 * HOUR_MS }]);
    expect(windowsOf('d2', NOON)).toEqual([
      { from: NOON - 3 * DAY_MS, to: NOON - 2 * DAY_MS },
      { from: NOON - 10 * DAY_MS, to: NOON - 9 * DAY_MS },
    ]);
    expect(windowsOf('d7', NOON)).toEqual([{ from: NOON + 2 * HOUR_MS, to: NOON + 12 * HOUR_MS }]);
  });
});
