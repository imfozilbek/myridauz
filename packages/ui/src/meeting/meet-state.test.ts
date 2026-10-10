import { loadBrand } from '@platform/brands';
import { meetingStartsAt, tripEndsAt } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { akmal, madina } from './meet-test-kit';
import { meetingOpen, meetingPoints, meetStep } from './meet-state';

const MEET = loadBrand().schedule.meetMinutes;

const { trip } = madina;

describe('the driver at the points (docs/126, G63)', () => {
  it('goes «Men keldim», then «Keldi» or «Kelmadi»', () => {
    expect(meetStep(madina)).toBe('come');
    expect(meetStep({ ...madina, driverCameAt: 1 })).toBe('answer');
    expect(meetStep({ ...madina, driverCameAt: 1, metAt: 2 })).toBe('met');
    // In the car by the passenger's own «Mashinaga chiqdim» is met too.
    expect(meetStep({ ...madina, boardedAt: 2 })).toBe('met');
    // «Yetib keldim» of the passenger too: the server refuses «Kelmadi» after it (G63 B2).
    expect(meetStep({ ...madina, driverCameAt: 1, arrivedAt: 2 })).toBe('met');
    expect(meetStep({ ...madina, noShowAt: 2 })).toBe('no_show');
  });

  it('opens before the departure and closes with the trip, as on the server', () => {
    const opens = meetingStartsAt(trip.departAt, MEET);
    expect(meetingOpen(trip, opens - 1, MEET)).toBe(false);
    expect(meetingOpen(trip, opens, MEET)).toBe(true);
    expect(meetingOpen(trip, tripEndsAt(trip.departAt, trip.km) - 1, MEET)).toBe(true);
    expect(meetingOpen(trip, tripEndsAt(trip.departAt, trip.km), MEET)).toBe(false);
    expect(meetingOpen({ ...trip, status: 'completed' }, opens, MEET)).toBe(false);
    expect(meetingOpen({ ...trip, status: 'full' }, opens, MEET)).toBe(true);
  });

  it('numbers the points in the order of the way, confirmed seats only', () => {
    const asked = { ...madina, id: 'r1', status: 'requested' as const };
    const points = meetingPoints([akmal, asked, madina]);
    expect(points.map(({ booking }) => booking.id).sort()).toEqual(['a1', 'm1']);
    expect(points.map(({ number }) => number)).toEqual([1, 2]);
    // A passenger without a point of the pickup comes after the points.
    const nowhere = { ...madina, id: 'n1', pickup: null };
    expect(meetingPoints([nowhere, madina]).at(-1)).toEqual({ booking: nowhere, number: 2 });
  });
});
