import { describe, expect, it } from 'vitest';
import { remindTrips, type RemindersDeps } from './application/remind';
import { createMemoryFirst } from './infrastructure/reminder-store';
import { booking, HOUR, MINUTE, MORNING, trip } from './reminders-test-kit';

describe('a reminder the queue refused', () => {
  // G89: the queue refused: the reminders are held again at the next run, not lost.
  it('holds again the reminders the queue refused', async () => {
    const departAt = MORNING + 24 * HOUR + 10 * MINUTE;
    const first = createMemoryFirst();
    const held: string[] = [];
    let refuse = true;
    const deps: RemindersDeps = {
      trips: async () => [trip('t1', departAt)],
      bookings: async () => [booking('b1', 't1')],
      first,
      forget: first.forget,
      schedule: async (items) => {
        if (refuse) throw new Error('queue');
        held.push(...items.map(({ reminder }) => reminder.bookingId ?? 'driver'));
      },
      windowMs: 15 * MINUTE,
      now: () => MORNING,
    };
    await expect(remindTrips(deps)).rejects.toThrow('queue');
    refuse = false;
    await remindTrips(deps);
    expect(held).toEqual(['b1', 'driver']);
  });
});
