import { DAY_MS, HOUR_MS, tashkentDate, tashkentDayStart, tashkentTime } from '@platform/contracts';

const DAY_BEFORE_MS = 24 * HOUR_MS;
const SOON_MS = 2 * HOUR_MS;
// A "day before" reminder closer than this to the trip only repeats the "soon" one.
const MIN_LEAD_MS = 3 * HOUR_MS;
// People are not woken up: the "day before" reminder waits for the day time in Tashkent.
const DAY_STARTS = '08:00';
const DAY_STARTS_MS = 8 * HOUR_MS;
const DAY_ENDS = '22:00';

export type ReminderKind = 'day' | 'soon';
export const REMINDER_KINDS: readonly ReminderKind[] = ['day', 'soon'];

// The first day time in Tashkent from a moment on: the moment itself, or the next 08:00.
function dayTimeFrom(at: number): number {
  const time = tashkentTime(at);
  if (time >= DAY_STARTS && time < DAY_ENDS) return at;
  const morning = tashkentDayStart(tashkentDate(at)) + DAY_STARTS_MS;
  return time < DAY_STARTS ? morning : morning + DAY_MS;
}

// The moment a reminder of a trip goes (docs/35, G10): 2 hours before at any time, and about a day
// before in the day time; a moment passed is now. null: this reminder never goes. The Cron finds the
// reminders of its window and the queue holds each one until its moment (G85 R3).
export function reminderAt(departAt: number, kind: ReminderKind, now: number): number | null {
  if (departAt <= now) return null;
  if (kind === 'soon') return Math.max(departAt - SOON_MS, now);
  const at = dayTimeFrom(Math.max(departAt - DAY_BEFORE_MS, now));
  return departAt - at > MIN_LEAD_MS ? at : null;
}

export const REMINDER_HORIZON_MS = DAY_BEFORE_MS;
