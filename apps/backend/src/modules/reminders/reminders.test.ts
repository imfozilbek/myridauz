import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { remindTrips, tellReminder, type Reminder, type RemindersDeps } from './application/remind';
import { reminderAt } from './domain/due';
import { createMemoryFirst } from './infrastructure/reminder-store';
import { reminderOf, reminderTask } from './infrastructure/reminder-task';
import { publicIdOf } from '../../test-people';

const HOUR = 3_600_000;
const MINUTE = 60_000;
// 2026-10-01 10:00 in Tashkent: day time.
const MORNING = Date.parse('2026-10-01T05:00:00Z');
// 2026-10-01 23:30 in Tashkent: night.
const NIGHT = Date.parse('2026-10-01T18:30:00Z');
// 2026-10-02 08:00 in Tashkent: the day time after that night.
const NEXT_MORNING = Date.parse('2026-10-02T03:00:00Z');

describe('the moment a trip is reminded (G10, G85 R3)', () => {
  it('reminds a day before in the day time and 2 hours before at any time, at the minute', () => {
    expect(reminderAt(MORNING + 25 * HOUR, 'day', MORNING)).toBe(MORNING + HOUR);
    expect(reminderAt(MORNING + 25 * HOUR, 'soon', MORNING)).toBe(MORNING + 23 * HOUR);
    // A day before falls in the night: the morning after, while the trip is more than 3 hours away.
    expect(reminderAt(NIGHT + 20 * HOUR, 'day', NIGHT)).toBe(NEXT_MORNING);
    expect(reminderAt(NIGHT + 11 * HOUR, 'day', NIGHT)).toBeNull();
    // Too close for "a day before"; "soon" is due already, so it goes now.
    expect(reminderAt(MORNING + 2.5 * HOUR, 'day', MORNING)).toBeNull();
    expect(reminderAt(NIGHT + HOUR, 'soon', NIGHT)).toBe(NIGHT);
    expect(reminderAt(NIGHT - HOUR, 'soon', NIGHT)).toBeNull();
  });
});

const trip = (id: string, departAt: number) => ({ id, departAt, driver: { id: publicIdOf(1) } }) as Trip;
const booking = (id: string, tripId: string) =>
  ({ id, seats: 1, trip: { id: tripId }, passenger: { id: publicIdOf(50) } }) as Booking;

describe('holding reminders until their moment, once (G10, G85 R3)', () => {
  it('holds the reminders of the next 15 minutes for each passenger and the driver', async () => {
    let now = MORNING;
    const held: string[] = [];
    const departAt = MORNING + 24 * HOUR + 10 * MINUTE;
    const deps: RemindersDeps = {
      trips: async () => [trip('t1', departAt), trip('t2', departAt)],
      bookings: async () => [booking('b1', 't1'), booking('b2', 't1')],
      first: createMemoryFirst(),
      schedule: async (items) =>
        void held.push(
          ...items.map(
            ({ reminder, at }) => `${reminder.bookingId ?? 'driver'} ${reminder.kind} ${at - now}`,
          ),
        ),
      windowMs: 15 * MINUTE,
      now: () => now,
    };
    await remindTrips(deps);
    await remindTrips(deps);
    expect(held).toEqual([`b1 day ${10 * MINUTE}`, `b2 day ${10 * MINUTE}`, `driver day ${10 * MINUTE}`]);
    now = departAt - 2 * HOUR - 5 * MINUTE;
    await remindTrips(deps);
    expect(held.slice(3)).toEqual([
      `b1 soon ${5 * MINUTE}`,
      `b2 soon ${5 * MINUTE}`,
      `driver soon ${5 * MINUTE}`,
    ]);
  });

  it('reads the trip again at the moment: a cancelled booking or a moved trip reminds nobody', async () => {
    const told: string[] = [];
    let trips = [trip('t1', MORNING)];
    let bookings = [booking('b1', 't1')];
    const deps = {
      trips: async () => trips,
      bookings: async () => bookings,
      tell: {
        passenger: async (item: Booking, kind: string) => void told.push(`${item.id} ${kind}`),
        driver: async (item: Trip, kind: string) => void told.push(`${item.id} ${kind}`),
      },
    };
    const reminder: Reminder = { kind: 'soon', tripId: 't1', departAt: MORNING, bookingId: 'b1' };
    const driver: Reminder = { kind: 'soon', tripId: 't1', departAt: MORNING };
    await tellReminder(deps, reminder);
    await tellReminder(deps, driver);
    bookings = [];
    await tellReminder(deps, reminder);
    await tellReminder(deps, driver);
    trips = [];
    bookings = [booking('b1', 't1')];
    await tellReminder(deps, reminder);
    expect(told).toEqual(['b1 soon', 't1 soon']);
  });

  it('rides the queue as a task and comes back the same; a broken one is dropped', () => {
    const reminder: Reminder = { kind: 'day', tripId: 't1', departAt: MORNING, bookingId: 'b1' };
    expect(reminderOf(reminderTask(reminder))).toEqual(reminder);
    expect(reminderOf(reminderTask({ kind: 'soon', tripId: 't1', departAt: 5 }))).toEqual({
      kind: 'soon',
      tripId: 't1',
      departAt: 5,
    });
    expect(reminderOf({ task: 'reminder', data: { kind: 'week' } })).toBeNull();
  });
});
