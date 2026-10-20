import { describe, expect, it } from 'vitest';
import { HOUR_MS } from './tashkent-time';
import { seatHolds, tripHolds } from './one-at-a-time';

const NOW = Date.UTC(2026, 9, 12, 6);
const trip = {
  status: 'active' as const,
  departAt: NOW + HOUR_MS,
  departUntil: null,
  km: 300,
  arrivedAt: null,
};
const seat = { status: 'confirmed' as const, expiresAt: NOW + HOUR_MS, arrivedAt: null, noShowAt: null };

describe('one at a time (owner decision 12.10.2026, docs/172)', () => {
  it('a trip holds its driver until «Yetib keldik», a cancel or its end', () => {
    expect(tripHolds(trip, NOW)).toBe(true);
    expect(tripHolds({ ...trip, status: 'full' }, NOW)).toBe(true);
    expect(tripHolds({ ...trip, arrivedAt: NOW }, NOW)).toBe(false);
    expect(tripHolds({ ...trip, status: 'cancelled' }, NOW)).toBe(false);
    expect(tripHolds(trip, NOW + 30 * HOUR_MS)).toBe(false);
  });

  it('a range holds its driver until the end counted from its last hour (docs/216)', () => {
    const end = NOW + 8 * HOUR_MS;
    expect(tripHolds(trip, end + HOUR_MS)).toBe(false);
    expect(tripHolds({ ...trip, departUntil: NOW + 3 * HOUR_MS }, end + HOUR_MS)).toBe(true);
  });

  it('a seat holds its passenger until her «Yetib keldim», «Kelmadi» or the end of the trip', () => {
    expect(seatHolds(seat, true, NOW)).toBe(true);
    expect(seatHolds(seat, false, NOW)).toBe(false);
    expect(seatHolds({ ...seat, arrivedAt: NOW }, true, NOW)).toBe(false);
    expect(seatHolds({ ...seat, noShowAt: NOW }, true, NOW)).toBe(false);
    expect(seatHolds({ ...seat, status: 'declined' }, true, NOW)).toBe(false);
  });

  it('an ask without an answer holds until its time to answer', () => {
    const asked = { ...seat, status: 'requested' as const };
    expect(seatHolds(asked, true, NOW)).toBe(true);
    expect(seatHolds(asked, true, NOW + 2 * HOUR_MS)).toBe(false);
  });
});
