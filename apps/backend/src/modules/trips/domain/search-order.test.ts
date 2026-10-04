import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { byHourThenRating } from './search-order';

const AT = Date.parse('2026-10-02T03:00:00Z');
const MINUTE = 60 * 1000;
const trip = (id: string, average: number | null, minutes = 0) =>
  ({ id, departAt: AT + minutes * MINUTE, driver: { rating: { average, count: average ? 5 : 0 } } }) as Trip;

describe('the order of the search (docs/24, G41 docs/90 F-P14)', () => {
  it('puts a new driver above low ratings and below good ones, inside the same hour', () => {
    const order = [trip('low', 3.2), trip('new', null, 10), trip('top', 4.8, 20)].sort(byHourThenRating);
    expect(order.map((item) => item.id)).toEqual(['top', 'new', 'low']);
  });

  it('keeps the hour first: an earlier hour wins over any rating', () => {
    const order = [trip('later', 5, 90), trip('new', null)].sort(byHourThenRating);
    expect(order.map((item) => item.id)).toEqual(['new', 'later']);
  });
});
