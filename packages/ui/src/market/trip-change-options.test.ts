import { describe, expect, it } from 'vitest';
import { laterTimes, lowerPrices } from './trip-change-options';

const MINUTE = 60 * 1000;
// 08:00 and 23:30 in Tashkent.
const MORNING = Date.parse('2026-10-02T03:00:00Z');
const NIGHT = Date.parse('2026-10-02T18:30:00Z');

describe('what a driver may choose to change (G39, docs/104)', () => {
  it('offers later times by 15 minutes, at most +1 hour in all, the same day', () => {
    const at = (minutes: number) => MORNING + minutes * MINUTE;
    expect(laterTimes({ departAt: MORNING, departUntil: null, firstDepartAt: MORNING }, 60)).toEqual([
      at(15),
      at(30),
      at(45),
      at(60),
    ]);
    expect(laterTimes({ departAt: at(45), departUntil: null, firstDepartAt: MORNING }, 60)).toEqual([at(60)]);
    expect(laterTimes({ departAt: at(60), departUntil: null, firstDepartAt: MORNING }, 60)).toEqual([]);
    expect(laterTimes({ departAt: NIGHT, departUntil: null, firstDepartAt: NIGHT }, 60)).toEqual([
      NIGHT + 15 * MINUTE,
    ]);
  });

  it('moves a range whole by a whole hour, its end the same day (G90, docs/216)', () => {
    const HOUR = 60 * MINUTE;
    const range = { departAt: MORNING, departUntil: MORNING + 2 * HOUR, firstDepartAt: MORNING };
    expect(laterTimes(range, 60)).toEqual([MORNING + HOUR]);
    expect(laterTimes({ ...range, departAt: MORNING + HOUR }, 60)).toEqual([]);
    // 21:00 … 23:00: one hour later would end at midnight, the next day.
    const late = MORNING + 13 * HOUR;
    expect(laterTimes({ departAt: late, departUntil: late + 2 * HOUR, firstDepartAt: late }, 60)).toEqual([]);
  });

  it('offers lower prices by the step, not below the bound', () => {
    expect(lowerPrices(95000, 30000, 5000)).toEqual([90000, 85000, 80000, 75000]);
    expect(lowerPrices(40000, 30000, 5000)).toEqual([35000, 30000]);
    expect(lowerPrices(30000, 30000, 5000)).toEqual([]);
  });
});
