import { z } from 'zod';
import type { TimedTask } from '../../notifications';
import type { Reminder } from '../application/remind';

// A reminder rides the queue as a timed task (G85 R3); what comes back is read again, never trusted.
const reminderSchema = z.object({
  kind: z.enum(['day', 'soon']),
  tripId: z.string(),
  departAt: z.number(),
  bookingId: z.string().optional(),
});

export const reminderTask = (reminder: Reminder): TimedTask => ({ task: 'reminder', data: { ...reminder } });

export function reminderOf(task: TimedTask): Reminder | null {
  const parsed = reminderSchema.safeParse(task.data);
  if (!parsed.success) return null;
  const { bookingId, ...rest } = parsed.data;
  return bookingId === undefined ? rest : { ...rest, bookingId };
}
