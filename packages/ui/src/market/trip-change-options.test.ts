import { describe, expect, it } from 'vitest';
import { laterTimes, lowerPrices } from './trip-change-options';

const MINUTE = 60 * 1000;
// 08:00 and 23:30 in Tashkent.
const MORNING = Date.parse('2026-10-02T03:00:00Z');
const NIGHT = Date.parse('2026-10-02T18:30:00Z');

describe('what a driver may choose to change (G39, docs/104)', () => {
  it('offers later times by 15 minutes, at most +1 hour in all, the same day', () => {
    const at = (minutes: number) => MORNING + minutes * MINUTE;
    expect(laterTimes({ departAt: MORNING, firstDepartAt: MORNING }, 60)).toEqual([
      at(15),
      at(30),
      at(45),
      at(60),
    ]);
    expect(laterTimes({ departAt: at(45), firstDepartAt: MORNING }, 60)).toEqual([at(60)]);
    expect(laterTimes({ departAt: at(60), firstDepartAt: MORNING }, 60)).toEqual([]);
    expect(laterTimes({ departAt: NIGHT, firstDepartAt: NIGHT }, 60)).toEqual([NIGHT + 15 * MINUTE]);
  });

  it('offers lower prices by the step, not below the bound', () => {
    expect(lowerPrices(95000, 30000, 5000)).toEqual([90000, 85000, 80000, 75000]);
    expect(lowerPrices(40000, 30000, 5000)).toEqual([35000, 30000]);
    expect(lowerPrices(30000, 30000, 5000)).toEqual([]);
  });
});
