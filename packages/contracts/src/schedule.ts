import { z } from 'zod';
import { locationIdSchema } from './locations';
import { MINUTE_MS } from './team-hours';
import { tashkentDayStart, tashkentTime } from './tashkent-time';

// When a driver may leave (G38, docs/103). The numbers are the brand's (docs/22).
export type ScheduleRules = {
  // A trip leaves at least this long after it is made, at most daysAhead later.
  readonly leadMinutes: number;
  readonly daysAhead: number;
  // The time a day other than today opens with.
  readonly defaultTime: string;
  readonly maxActiveTrips: number;
  // The time to gather people before a trip: its time on the road × factor, within the bounds.
  readonly gather: { readonly factor: number; readonly minMinutes: number; readonly maxMinutes: number };
  // A trip moves at most this much later than its first time (docs/104).
  readonly shiftMinutes: number;
};

// A trip of the driver as the schedule sees it: where and when it starts and ends.
export type PlannedTrip = {
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly arriveAt: number;
};

// A new trip cannot leave strictly between from and to.
export const busyWindowSchema = z.object({ from: z.number().int(), to: z.number().int() });
export type BusyWindow = z.infer<typeof busyWindowSchema>;

// The busy times of the driver for one route, and whether the trip limit is reached.
export const DRIVER_SCHEDULE_PATH = '/driver/schedule';
export const scheduleQuerySchema = z.object({ from: locationIdSchema, to: locationIdSchema });
export const scheduleSchema = z.object({ windows: z.array(busyWindowSchema), full: z.boolean() });
export type Schedule = z.infer<typeof scheduleSchema>;

export const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * MINUTE_MS;
const SLOTS_A_DAY = (24 * 60) / SLOT_MINUTES;

export const gatherMs = (roadMs: number, rules: ScheduleRules) =>
  Math.min(
    rules.gather.maxMinutes * MINUTE_MS,
    Math.max(rules.gather.minMinutes * MINUTE_MS, roadMs * rules.gather.factor),
  );

// The driver must make it (docs/103): after a trip, the road to the start of the new one and the time
// to gather its people; before a trip, the same from the end of the new one. roadMs: between places.
export function busyWindows(
  trips: readonly PlannedTrip[],
  route: { readonly from: string; readonly to: string; readonly roadMs: number },
  roadMs: (from: string, to: string) => number,
  rules: ScheduleRules,
): BusyWindow[] {
  return trips.map((trip) => ({
    from:
      trip.departAt -
      route.roadMs -
      roadMs(route.to, trip.from) -
      gatherMs(trip.arriveAt - trip.departAt, rules),
    to: trip.arriveAt + roadMs(trip.to, route.from) + gatherMs(route.roadMs, rules),
  }));
}

export const earliestDepart = (now: number, rules: ScheduleRules) => now + rules.leadMinutes * MINUTE_MS;

export const isBusy = (at: number, windows: readonly BusyWindow[]) =>
  windows.some((window) => at > window.from && at < window.to);

// The times of a Tashkent day a trip may leave at, every 30 minutes: "08:00", "08:30" …
export function daySlots(date: string, now: number, windows: readonly BusyWindow[], rules: ScheduleRules) {
  const start = tashkentDayStart(date);
  const first = earliestDepart(now, rules);
  return Array.from({ length: SLOTS_A_DAY }, (_, index) => start + index * SLOT_MS)
    .filter((at) => at >= first && !isBusy(at, windows))
    .map(tashkentTime);
}

// The time a day opens with: the brand's morning time on another day, the first free time today or
// when the morning is taken (docs/103, point 5).
export function defaultSlot(slots: readonly string[], today: boolean, rules: ScheduleRules) {
  if (today) return slots[0] ?? null;
  return slots.find((slot) => slot >= rules.defaultTime) ?? slots[0] ?? null;
}
