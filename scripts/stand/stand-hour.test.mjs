import { describe, expect, it } from 'vitest';
import { shiftTo } from './stand-hour.mjs';

// 10:00 in Tashkent, 05:00 UTC.
const MORNING = Date.parse('2026-10-11T05:00:00Z');
const HOUR_S = 3600;

// pnpm stand:check --at (G77, lesson 223): the shift of the clock to an hour of the Tashkent day.
describe('the stand at another hour', () => {
  it('moves the clock to that time of the Tashkent day of now', () => {
    expect(shiftTo('23:30', MORNING)).toBe(13.5 * HOUR_S);
    expect(shiftTo('08:00', MORNING)).toBe(-2 * HOUR_S);
    // 02:00 in Tashkent is still 10 October in UTC: the day of Tashkent counts.
    expect(shiftTo('23:30', Date.parse('2026-10-10T21:00:00Z'))).toBe(21.5 * HOUR_S);
  });

  it('takes only a time of the day', () => {
    expect(() => shiftTo('24:00', MORNING)).toThrow(/--at takes a time of the day/u);
    expect(() => shiftTo(undefined, MORNING)).toThrow(/--at takes a time of the day/u);
  });
});
