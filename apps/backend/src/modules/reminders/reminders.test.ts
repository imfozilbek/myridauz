import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { remindTrips, type RemindersDeps } from './application/remind';
import { dueReminder } from './domain/due';
import { createMemoryFirst } from './infrastructure/reminder-store';

const HOUR = 3_600_000;
// 2026-10-01 10:00 in Tashkent: day time.
const MORNING = Date.parse('2026-10-01T05:00:00Z');
// 2026-10-01 23:30 in Tashkent: night.
const NIGHT = Date.parse('2026-10-01T18:30:00Z');

describe('when a trip is reminded (G10)', () => {
  it('reminds a day before in the day time and 2 hours before at any time', () => {
    expect(dueReminder(MORNING + 23 * HOUR, MORNING)).toBe('day');
    expect(dueReminder(MORNING + 25 * HOUR, MORNING)).toBeNull();
    expect(dueReminder(NIGHT + 20 * HOUR, NIGHT)).toBeNull();
    expect(dueReminder(MORNING + 2.5 * HOUR, MORNING)).toBeNull();
    expect(dueReminder(NIGHT + HOUR, NIGHT)).toBe('soon');
    expect(dueReminder(NIGHT - HOUR, NIGHT)).toBeNull();
  });
});

const trip = (id: string, departAt: number) => ({ id, departAt, driver: { id: 1 } }) as Trip;
const booking = (id: string, tripId: string, seats: number) =>
  ({ id, seats, trip: { id: tripId }, passenger: { id: 50 } }) as Booking;

describe('sending reminders once (G10)', () => {
  it('tells each passenger and the driver once, and nobody about a trip without riders', async () => {
    let now = MORNING;
    const told: string[] = [];
    const deps: RemindersDeps = {
      trips: async () => [trip('t1', MORNING + 23 * HOUR), trip('t2', MORNING + 23 * HOUR)],
      bookings: async () => [booking('b1', 't1', 1), booking('b2', 't1', 2)],
      first: createMemoryFirst(),
      tell: {
        passenger: async (item, kind) => void told.push(`${item.id} ${kind}`),
        driver: async (item, riders, kind) => void told.push(`${item.id} ${riders} ${kind}`),
      },
      now: () => now,
    };
    await remindTrips(deps);
    await remindTrips(deps);
    expect(told).toEqual(['b1 day', 'b2 day', 't1 3 day']);
    now = MORNING + 22 * HOUR;
    await remindTrips(deps);
    expect(told.slice(3)).toEqual(['b1 soon', 'b2 soon', 't1 3 soon']);
  });
});
