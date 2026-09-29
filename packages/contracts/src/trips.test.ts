import { describe, expect, it } from 'vitest';
import { arrivalAt } from './trips';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
// 08:00 in Tashkent.
const DEPART = Date.parse('2026-10-01T03:00:00Z');

describe('arrivalAt: the approximate arrival (owner decision 29.09.2026)', () => {
  it('takes about 7 hours from Yashnobod to Yakkabogʻ (≈ 417 km)', () => {
    expect(arrivalAt(DEPART, 417)).toBe(DEPART + 7 * HOUR);
  });

  it('rounds up to 5 minutes', () => {
    expect(arrivalAt(DEPART, 300)).toBe(DEPART + 5 * HOUR);
    expect(arrivalAt(DEPART, 301)).toBe(DEPART + 5 * HOUR + 5 * MINUTE);
  });
});
