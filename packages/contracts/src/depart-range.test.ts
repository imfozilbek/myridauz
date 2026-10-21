import { describe, expect, it } from 'vitest';
import { lastDepart, rangeEnds, rangeFits, rangeStarts } from './depart-range';
import { slotAt } from './schedule';
import { HOUR_MS } from './tashkent-time';

const RULES = { leadMinutes: 60, rangeMaxHours: 3 };
const DAY = '2026-10-21';
const EIGHT = slotAt(DAY, '08:00');

describe('a range of the time (owner decision 20.10.2026, docs/216)', () => {
  it('lasts whole hours, from one to the brand hours, on one day', () => {
    expect(rangeFits(EIGHT, EIGHT + HOUR_MS, RULES)).toBe(true);
    expect(rangeFits(EIGHT, EIGHT + 3 * HOUR_MS, RULES)).toBe(true);
    expect(rangeFits(EIGHT, EIGHT, RULES)).toBe(false);
    expect(rangeFits(EIGHT, EIGHT + 4 * HOUR_MS, RULES)).toBe(false);
    expect(rangeFits(EIGHT, EIGHT + 90 * 60 * 1000, RULES)).toBe(false);
    expect(rangeFits(slotAt(DAY, '08:30'), slotAt(DAY, '09:30'), RULES)).toBe(false);
    expect(rangeFits(EIGHT, EIGHT - HOUR_MS, RULES)).toBe(false);
    expect(rangeFits(slotAt(DAY, '23:00'), slotAt('2026-10-22', '00:00'), RULES)).toBe(false);
  });

  it('ends at the next whole hours of the same day', () => {
    expect(rangeEnds(DAY, '08:00', RULES)).toEqual(['09:00', '10:00', '11:00']);
    expect(rangeEnds(DAY, '21:00', RULES)).toEqual(['22:00', '23:00']);
    expect(rangeEnds(DAY, '23:00', RULES)).toEqual([]);
    expect(rangeEnds(DAY, '08:30', RULES)).toEqual([]);
    expect(rangeEnds(DAY, '08:00', { rangeMaxHours: 1 })).toEqual(['09:00']);
  });

  it('starts only at a free whole hour that has an end (lesson 248)', () => {
    const now = slotAt(DAY, '06:10');
    const starts = rangeStarts(DAY, now, RULES);
    expect(starts[0]).toBe('08:00');
    expect(starts.at(-1)).toBe('22:00');
    expect(starts.every((slot) => slot.endsWith(':00'))).toBe(true);
  });

  it('leaves at the latest at the end of the range, else at its time', () => {
    expect(lastDepart({ departAt: EIGHT, departUntil: null })).toBe(EIGHT);
    expect(lastDepart({ departAt: EIGHT, departUntil: EIGHT + 2 * HOUR_MS })).toBe(EIGHT + 2 * HOUR_MS);
  });
});
