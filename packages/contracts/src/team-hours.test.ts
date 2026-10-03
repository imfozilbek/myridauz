import { describe, expect, it } from 'vitest';
import { DAY_MS, tashkentDayStart } from './tashkent-time';
import { hourLabel, isTeamTime, MINUTE_MS, teamWaitMs } from './team-hours';

const HOURS = { from: 7, to: 23 };
const DAY = tashkentDayStart('2026-10-02');
const at = (hour: number, minute = 0) => DAY + hour * 60 * MINUTE_MS + minute * MINUTE_MS;

describe('team hours (G34)', () => {
  it('works from 7:00 included to 23:00 excluded, Tashkent time', () => {
    expect(isTeamTime(at(6, 59), HOURS)).toBe(false);
    expect(isTeamTime(at(7), HOURS)).toBe(true);
    expect(isTeamTime(at(22, 59), HOURS)).toBe(true);
    expect(isTeamTime(at(23), HOURS)).toBe(false);
    expect(isTeamTime(at(2), HOURS)).toBe(false);
  });

  it('counts the wait inside the day as it is', () => {
    expect(teamWaitMs(at(10), at(10, 30), HOURS)).toBe(30 * MINUTE_MS);
  });

  it('a night application starts waiting at 7:00', () => {
    expect(teamWaitMs(at(2), at(6, 59), HOURS)).toBe(0);
    expect(teamWaitMs(at(2), at(7, 30), HOURS)).toBe(30 * MINUTE_MS);
  });

  it('the night between two days does not count', () => {
    expect(teamWaitMs(at(22, 40), at(23, 50), HOURS)).toBe(20 * MINUTE_MS);
    expect(teamWaitMs(at(22, 40), DAY_MS + at(7, 10), HOURS)).toBe(30 * MINUTE_MS);
  });

  it('nothing waited before the application', () => {
    expect(teamWaitMs(at(12), at(11), HOURS)).toBe(0);
  });

  it('reads an hour as people do', () => {
    expect(hourLabel(7)).toBe('7:00');
    expect(hourLabel(23)).toBe('23:00');
  });
});
