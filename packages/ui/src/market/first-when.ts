import {
  DAY_MS,
  MINUTE_MS,
  daySlots,
  defaultSlot,
  tashkentDate,
  tashkentDayStart,
  type Schedule,
  type ScheduleRules,
} from '@platform/contracts';
import { today } from './when';

const HOUR_MINUTES = 60;

// "07:30" on a Tashkent day → the moment in ms.
export const departAtOf = (date: string, time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return tashkentDayStart(date) + (hours * HOUR_MINUTES + minutes) * MINUTE_MS;
};

// The times a driver may leave at on a day (G38, docs/103).
export const slotsOn = (day: string, now: number, schedule: Schedule, rules: ScheduleRules) =>
  daySlots(day, now, schedule.windows, rules);

// The first day with a free time: today, else tomorrow (docs/103).
export const firstDayOf = (now: number, schedule: Schedule, rules: ScheduleRules) =>
  slotsOn(today(now), now, schedule, rules).length > 0 ? today(now) : tashkentDate(now + DAY_MS);

// The time a day opens with: the morning time on another day, the first free time today (docs/103).
export const timeOn = (day: string, now: number, schedule: Schedule, rules: ScheduleRules) =>
  defaultSlot(slotsOn(day, now, schedule, rules), day === today(now), rules);
