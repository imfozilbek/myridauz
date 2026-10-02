import { DAY_MS, tashkentDate, tashkentDayStart } from './tashkent-time';

// The hours the team checks driver applications, Tashkent time: from included, to excluded (G34).
export type TeamHours = { readonly from: number; readonly to: number };

const HOUR_MS = 60 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;

// The team hours of the Tashkent day that starts at dayStart.
const windowOf = (dayStart: number, hours: TeamHours) => ({
  start: dayStart + hours.from * HOUR_MS,
  end: dayStart + hours.to * HOUR_MS,
});

export const isTeamTime = (ms: number, hours: TeamHours): boolean => {
  const { start, end } = windowOf(tashkentDayStart(tashkentDate(ms)), hours);
  return ms >= start && ms < end;
};

// How long something has waited for the team, counting only team hours: an application sent at
// 02:00 starts waiting at the opening hour, and the night does not count.
export function teamWaitMs(since: number, now: number, hours: TeamHours): number {
  let waited = 0;
  for (let day = tashkentDayStart(tashkentDate(since)); day <= now; day += DAY_MS) {
    const { start, end } = windowOf(day, hours);
    waited += Math.max(0, Math.min(end, now) - Math.max(start, since));
  }
  return waited;
}

// "7:00", "23:00": an hour of the team as people read it.
export const hourLabel = (hour: number) => `${hour}:00`;
