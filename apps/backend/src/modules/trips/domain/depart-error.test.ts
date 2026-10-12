import { describe, expect, it } from 'vitest';
import { departError } from './trip';

// Monday 12 October 2026, 08:00 in Tashkent (UTC+5): the row of the week ends on Sunday the 18th.
const NOW = Date.parse('2026-10-12T03:00:00Z');
const DAYS_AHEAD = 6;

// The days of a trip are the 7 days of the row, from today (owner decision 12.10.2026, docs/172).
describe('how far ahead a trip goes', () => {
  it('takes any hour of the last day of the row', () => {
    expect(departError(Date.parse('2026-10-18T18:00:00Z'), NOW, DAYS_AHEAD)).toBeNull();
  });

  it('refuses the day after the row', () => {
    expect(departError(Date.parse('2026-10-18T19:00:00Z'), NOW, DAYS_AHEAD)).toBe('trips.invalid_input');
  });

  it('refuses a time already gone', () => {
    expect(departError(NOW - 1, NOW, DAYS_AHEAD)).toBe('trips.in_past');
  });
});
