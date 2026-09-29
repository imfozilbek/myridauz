import { tashkentTime } from '@platform/contracts';

const HOUR_MS = 60 * 60 * 1000;
const DAY_BEFORE_MS = 24 * HOUR_MS;
const SOON_MS = 2 * HOUR_MS;
// A "day before" reminder closer than this to the trip only repeats the "soon" one.
const MIN_LEAD_MS = 3 * HOUR_MS;
// People are not woken up: the "day before" reminder waits for the day time in Tashkent.
const DAY_STARTS = '08:00';
const DAY_ENDS = '22:00';

export type ReminderKind = 'day' | 'soon';

// Which reminder a trip is due now (docs/35, G10): about a day before, in the day time, and 2 hours
// before. The Cron job runs every 15 minutes; each reminder goes once.
export function dueReminder(departAt: number, now: number): ReminderKind | null {
  const left = departAt - now;
  if (left <= 0) return null;
  if (left <= SOON_MS) return 'soon';
  const time = tashkentTime(now);
  const daytime = time >= DAY_STARTS && time < DAY_ENDS;
  return left <= DAY_BEFORE_MS && left > MIN_LEAD_MS && daytime ? 'day' : null;
}

export const REMINDER_HORIZON_MS = DAY_BEFORE_MS;
