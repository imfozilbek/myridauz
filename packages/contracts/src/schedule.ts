import { z } from 'zod';
import { MINUTE_MS } from './team-hours';
import { tashkentDayStart, tashkentTime } from './tashkent-time';

// When a driver may leave (G38, docs/103). The numbers are the brand's (docs/22).
export type ScheduleRules = {
  // A trip leaves at least this long after it is made, at most daysAhead later.
  readonly leadMinutes: number;
  readonly daysAhead: number;
  // The time a day other than today opens with.
  readonly defaultTime: string;
  // A trip moves at most this much later than its first time (docs/104).
  readonly shiftMinutes: number;
  // A range of whole hours is at most this long (owner decision 20.10.2026, docs/216).
  readonly rangeMaxHours: number;
};

// Whether the driver has a live trip already: one at a time (owner decision 12.10.2026, docs/172).
export const DRIVER_SCHEDULE_PATH = '/driver/schedule';
export const scheduleSchema = z.object({ full: z.boolean() });
export type Schedule = z.infer<typeof scheduleSchema>;

export const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * MINUTE_MS;
const SLOTS_A_DAY = (24 * 60) / SLOT_MINUTES;

const HOUR_MINUTES = 60;

// "07:30" on a Tashkent day: the moment in ms.
export const slotAt = (date: string, time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return tashkentDayStart(date) + (hours * HOUR_MINUTES + minutes) * MINUTE_MS;
};

export const earliestDepart = (now: number, rules: Pick<ScheduleRules, 'leadMinutes'>) =>
  now + rules.leadMinutes * MINUTE_MS;

// The times of a Tashkent day a trip may leave at, every 30 minutes: "08:00", "08:30" …
export function daySlots(date: string, now: number, rules: Pick<ScheduleRules, 'leadMinutes'>) {
  const start = tashkentDayStart(date);
  const first = earliestDepart(now, rules);
  return Array.from({ length: SLOTS_A_DAY }, (_, index) => start + index * SLOT_MS)
    .filter((at) => at >= first)
    .map(tashkentTime);
}

// The time a day opens with: the brand's morning time on another day, the first time left today
// (docs/103, point 5).
export function defaultSlot(slots: readonly string[], today: boolean, rules: ScheduleRules) {
  if (today) return slots[0] ?? null;
  return slots.find((slot) => slot >= rules.defaultTime) ?? slots[0] ?? null;
}
