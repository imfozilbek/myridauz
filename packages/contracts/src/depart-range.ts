import { daySlots, slotAt, type ScheduleRules } from './schedule';
import { HOUR_MS, tashkentDate, tashkentTime } from './tashkent-time';

// A range instead of one exact time (owner decision 20.10.2026, docs/216): «08:00 dan 10:00 gacha».
// Whole hours only, from one hour to the brand's rangeMaxHours, on one Tashkent day. The screen and
// the server check the same rules.
type RangeRules = Pick<ScheduleRules, 'rangeMaxHours'>;
type Depart = { readonly departAt: number; readonly departUntil: number | null };

const WHOLE_HOUR = ':00';

// The last moment the trip leaves at: the end of its range, else its time. The end of the trip and
// its arrival count from it (docs/216).
export const lastDepart = (trip: Depart) => trip.departUntil ?? trip.departAt;

// The time a moved trip had at first: a range moves whole (docs/104).
export const firstTimed = (trip: Depart & { readonly firstDepartAt: number }): Depart => ({
  departAt: trip.firstDepartAt,
  departUntil: trip.departUntil === null ? null : trip.departUntil - trip.departAt + trip.firstDepartAt,
});

// Whether a start and an end make a range a driver may choose.
export function rangeFits(departAt: number, departUntil: number, rules: RangeRules) {
  const hours = (departUntil - departAt) / HOUR_MS;
  return (
    departAt % HOUR_MS === 0 &&
    Number.isInteger(hours) &&
    hours >= 1 &&
    hours <= rules.rangeMaxHours &&
    tashkentDate(departUntil) === tashkentDate(departAt)
  );
}

// The ends a range from a whole hour may have on its day: the next whole hours, at most rangeMaxHours.
export function rangeEnds(date: string, start: string, rules: RangeRules) {
  const from = slotAt(date, start);
  if (!start.endsWith(WHOLE_HOUR)) return [];
  return Array.from({ length: rules.rangeMaxHours }, (_, index) => from + (index + 1) * HOUR_MS)
    .filter((at) => tashkentDate(at) === date)
    .map(tashkentTime);
}

// The starts of a range on a day: the free whole hours with at least one end (docs/216, lesson 248).
export const rangeStarts = (
  date: string,
  now: number,
  rules: Pick<ScheduleRules, 'leadMinutes' | 'rangeMaxHours'>,
) => daySlots(date, now, rules).filter((slot) => rangeEnds(date, slot, rules).length > 0);
