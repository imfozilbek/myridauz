import { ANSWER_NIGHT, DAY_MS, HOUR_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';

// 08:00 of the morning a night moment belongs to: the same day before 08:00, else the next day.
function morningOf(ms: number): number | null {
  const dayStart = tashkentDayStart(tashkentDate(ms));
  const morning = dayStart + ANSWER_NIGHT.morning * HOUR_MS;
  if (ms < morning) return morning;
  return ms >= dayStart + ANSWER_NIGHT.from * HOUR_MS ? morning + DAY_MS : null;
}

// An answer is waited for the brand's hours (24), but never after the departure (docs/35). An end at
// night moves to 08:00, still never after the departure (docs/127).
export function answerDeadline(departAt: number, now: number, hours: number): number {
  const end = now + hours * HOUR_MS;
  return Math.min(morningOf(end) ?? end, departAt);
}
