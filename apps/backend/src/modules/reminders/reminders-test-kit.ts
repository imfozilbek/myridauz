import type { Booking, Trip } from '@platform/contracts';
import { publicIdOf } from '../../test-people';

// Test helper of the trip reminders: a trip of driver 1, a seat of passenger 50, the clock.
export const HOUR = 3_600_000;
export const MINUTE = 60_000;
// 2026-10-01 10:00 in Tashkent: day time.
export const MORNING = Date.parse('2026-10-01T05:00:00Z');
export const trip = (id: string, departAt: number) =>
  ({ id, departAt, driver: { id: publicIdOf(1) } }) as Trip;
export const booking = (id: string, tripId: string) =>
  ({ id, seats: 1, trip: { id: tripId }, passenger: { id: publicIdOf(50) } }) as Booking;
