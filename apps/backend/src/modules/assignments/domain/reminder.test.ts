import { tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { dueSteps } from './reminder';

const RULES = { hours: { from: 7, to: 23 }, remindMinutes: 30, ownerMinutes: 50 };
const DAY = tashkentDayStart('2026-10-02');
const at = (hour: number, minute = 0) => DAY + (hour * 60 + minute) * 60 * 1000;

describe('reminders of a waiting application (G34)', () => {
  it('30 minutes: its moderator; 50 minutes: the owners too', () => {
    expect(dueSteps(at(10), at(10, 29), RULES)).toEqual([]);
    expect(dueSteps(at(10), at(10, 30), RULES)).toEqual(['moderator']);
    expect(dueSteps(at(10), at(10, 50), RULES)).toEqual(['moderator', 'owner']);
  });

  it('a night application starts waiting at 7:00', () => {
    expect(dueSteps(at(2), at(7, 29), RULES)).toEqual([]);
    expect(dueSteps(at(2), at(7, 30), RULES)).toEqual(['moderator']);
  });

  it('does not wake anybody at night, even when the wait is long', () => {
    expect(dueSteps(at(9), at(23, 10), RULES)).toEqual([]);
    expect(dueSteps(at(9), at(6, 50), RULES)).toEqual([]);
  });
});
