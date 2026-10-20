import { DAY_MS, daySlots, defaultSlot, tashkentDate, type ScheduleRules } from '@platform/contracts';
import { today } from './when';

// The times a driver may leave at on a day (G38, docs/103).
export const slotsOn = (day: string, now: number, rules: ScheduleRules) => daySlots(day, now, rules);

// The first day with a time left: today, else tomorrow (docs/103).
export const firstDayOf = (now: number, rules: ScheduleRules) =>
  slotsOn(today(now), now, rules).length > 0 ? today(now) : tashkentDate(now + DAY_MS);

// The time a day opens with: the morning time on another day, the first time left today (docs/103).
export const timeOn = (day: string, now: number, rules: ScheduleRules) =>
  defaultSlot(slotsOn(day, now, rules), day === today(now), rules);
