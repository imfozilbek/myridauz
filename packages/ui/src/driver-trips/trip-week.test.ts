import { DAY_MS, HOUR_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { trip } from '../market/market-test-kit';
import { isLive, isWayBack, tripToRepeat, weekOf } from './trip-week';

// 2026-10-02 08:00 in Tashkent: the trip of the test kit leaves at this time.
const NOW = trip.departAt;
const back = { ...trip, id: 't2', from: trip.to, to: trip.from, departAt: NOW + 30 * HOUR_MS };

describe('the week and the marks of «Mening safarlarim» (G64, mockup g64/6)', () => {
  it('is today and the six days after it', () => {
    expect(weekOf(NOW)).toEqual([
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ]);
  });

  it('keeps a live trip in «Faol» and moves a cancelled or arrived one to «Oʻtgan»', () => {
    expect(isLive(trip, NOW - HOUR_MS * 3)).toBe(true);
    expect(isLive({ ...trip, status: 'cancelled' }, NOW - HOUR_MS * 3)).toBe(false);
    expect(isLive({ ...trip, arrivedAt: NOW }, NOW)).toBe(false);
  });

  it('calls the trip the other way within two days «Qaytish safari»', () => {
    expect(isWayBack(back, [trip, back])).toBe(true);
    expect(isWayBack(trip, [trip, back])).toBe(false);
    expect(isWayBack({ ...back, departAt: NOW + 3 * DAY_MS }, [trip])).toBe(false);
  });

  it('repeats the last trip that already left, never a cancelled one', () => {
    const earlier = { ...trip, id: 't0', departAt: NOW - DAY_MS };
    expect(tripToRepeat([earlier, trip, back], NOW + HOUR_MS)?.id).toBe('t1');
    expect(tripToRepeat([earlier, { ...trip, status: 'cancelled' as const }], NOW + HOUR_MS)?.id).toBe('t0');
    expect(tripToRepeat([back], NOW)).toBeNull();
  });
});
