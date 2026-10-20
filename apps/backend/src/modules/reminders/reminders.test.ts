import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { remindTrips, tellReminder, type Reminder, type RemindersDeps } from './application/remind';
import { reminderAt, spreadMoments } from './domain/due';
import { createMemoryFirst } from './infrastructure/reminder-store';
import { reminderOf, reminderTask } from './infrastructure/reminder-task';
import { booking, HOUR, MINUTE, MORNING, trip } from './reminders-test-kit';

// 2026-10-01 23:30 in Tashkent: night.
const NIGHT = Date.parse('2026-10-01T18:30:00Z');
// 2026-10-02 08:00 in Tashkent: the day time after that night.
const NEXT_MORNING = Date.parse('2026-10-02T03:00:00Z');

describe('the moment a trip is reminded (G10, G85 R3)', () => {
  it('reminds a day before in the day time and 2 hours before at any time, at the minute', () => {
    expect(reminderAt(MORNING + 25 * HOUR, 'day', MORNING)).toBe(MORNING + HOUR);
    expect(reminderAt(MORNING + 25 * HOUR, 'soon', MORNING)).toBe(MORNING + 23 * HOUR);
    // G89 C10: «2 soat qoldi» only while about 2 hours are left: not 40 minutes before.
    expect(reminderAt(MORNING + 1.5 * HOUR, 'soon', MORNING)).toBe(MORNING);
    expect(reminderAt(MORNING + (2 * HOUR) / 3, 'soon', MORNING)).toBeNull();
    // A day before falls in the night: the morning after, while the trip is more than 3 hours away.
    expect(reminderAt(NIGHT + 20 * HOUR, 'day', NIGHT)).toBe(NEXT_MORNING);
    expect(reminderAt(NIGHT + 11 * HOUR, 'day', NIGHT)).toBeNull();
    // Too close for "a day before"; "soon" is due already, so it goes now; an hour before is too late.
    expect(reminderAt(MORNING + 2.5 * HOUR, 'day', MORNING)).toBeNull();
    expect(reminderAt(NIGHT + 1.75 * HOUR, 'soon', NIGHT)).toBe(NIGHT);
    expect(reminderAt(NIGHT + HOUR, 'soon', NIGHT)).toBeNull();
    expect(reminderAt(NIGHT - HOUR, 'soon', NIGHT)).toBeNull();
  });
});

describe('holding reminders until their moment, once (G10, G85 R3)', () => {
  it('holds the reminders of the next 15 minutes for each passenger and the driver', async () => {
    let now = MORNING;
    const held: string[] = [];
    const departAt = MORNING + 24 * HOUR + 10 * MINUTE;
    const first = createMemoryFirst();
    const deps: RemindersDeps = {
      trips: async () => [trip('t1', departAt), trip('t2', departAt)],
      bookings: async () => [booking('b1', 't1'), booking('b2', 't1')],
      first,
      forget: first.forget,
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
    // One moment for three people: a tenth of a second apart (G85 T6).
    expect(held).toEqual([
      `b1 day ${10 * MINUTE}`,
      `b2 day ${10 * MINUTE + 100}`,
      `driver day ${10 * MINUTE + 200}`,
    ]);
    now = departAt - 2 * HOUR - 5 * MINUTE;
    await remindTrips(deps);
    expect(held.slice(3)).toEqual([
      `b1 soon ${5 * MINUTE}`,
      `b2 soon ${5 * MINUTE + 100}`,
      `driver soon ${5 * MINUTE + 200}`,
    ]);
  });

  it('reads the trip again at the moment: a cancelled booking or trip reminds nobody', async () => {
    const told: string[] = [];
    let found: Trip | undefined = { ...trip('t1', MORNING), status: 'active' };
    let bookings = [booking('b1', 't1')];
    const deps = {
      trip: async () => found,
      bookings: async () => bookings,
      schedule: async () => undefined,
      tell: {
        passenger: async (item: Booking, kind: string) => void told.push(`${item.id} ${kind}`),
        driver: async (item: Trip, kind: string) => void told.push(`${item.id} ${kind}`),
      },
      now: () => MORNING - 2 * HOUR,
    };
    const reminder: Reminder = { kind: 'soon', tripId: 't1', departAt: MORNING, bookingId: 'b1' };
    const driver: Reminder = { kind: 'soon', tripId: 't1', departAt: MORNING };
    await tellReminder(deps, reminder);
    await tellReminder(deps, driver);
    bookings = [];
    await tellReminder(deps, reminder);
    await tellReminder(deps, driver);
    bookings = [booking('b1', 't1')];
    found = { ...trip('t1', MORNING), status: 'cancelled' };
    await tellReminder(deps, reminder);
    found = undefined;
    await tellReminder(deps, reminder);
    expect(told).toEqual(['b1 soon', 't1 soon']);
  });

  // The reviewer of G85: a trip moved after its reminder was held is reminded at its new time.
  it('holds the reminder of a moved trip again for the moment of its new time', async () => {
    const held: { reminder: Reminder; at: number }[] = [];
    const moved = { ...trip('t1', MORNING + 30 * MINUTE), status: 'active' as const };
    const deps = {
      trip: async () => moved,
      bookings: async () => [booking('b1', 't1')],
      schedule: async (items: readonly { reminder: Reminder; at: number }[]) => void held.push(...items),
      tell: { passenger: async () => undefined, driver: async () => undefined },
      now: () => MORNING - 2 * HOUR,
    };
    await tellReminder(deps, { kind: 'soon', tripId: 't1', departAt: MORNING, bookingId: 'b1' });
    expect(held).toEqual([
      {
        reminder: { kind: 'soon', tripId: 't1', departAt: MORNING + 30 * MINUTE, bookingId: 'b1' },
        at: MORNING - 90 * MINUTE,
      },
    ]);
  });

  it('spreads many reminders of one moment over the next seconds, 10 a second', () => {
    const at = MORNING;
    expect(spreadMoments([at, at, at, at + 5000])).toEqual([at, at + 100, at + 200, at + 5000]);
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
