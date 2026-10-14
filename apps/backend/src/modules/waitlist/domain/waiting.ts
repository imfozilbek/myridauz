import {
  DAY_MS,
  ROLE_PAINS,
  tashkentDate,
  tashkentDayStart,
  WAITLIST_MIN_COUNT,
  type Pain,
  type Waiting,
  type WaitlistRole,
} from '@platform/contracts';

const PERCENT = 100;

// The pains of a person in the order of the screen: the first one speaks in the bot, the result and
// the message to a friend (docs/181).
export const orderedPains = (role: WaitlistRole, pains: readonly Pain[]): Pain[] =>
  (ROLE_PAINS[role] as readonly Pain[]).filter((pain) => pains.includes(pain));

// Who waits on a direction: the passengers, the drivers, and how many passengers chose a pain.
export type DirectionCounts = {
  readonly passengers: number;
  readonly drivers: number;
  readonly withPain: number;
};

// «N kishi kutmoqda» only from 10 passengers: an empty counter scares, the numbers are real (docs/181).
export function waitingOf(counts: DirectionCounts): Waiting | null {
  if (counts.passengers < WAITLIST_MIN_COUNT) return null;
  const share = Math.round((counts.withPain / counts.passengers) * PERCENT);
  return { passengers: counts.passengers, drivers: counts.drivers, share };
}

const WEEK_DAYS = 7;
// A person is told about an opening once a week at most (docs/181).
export const WEEK_MS = WEEK_DAYS * DAY_MS;
// getUTCDay counts from Sunday: Monday comes 6 days after it.
const FROM_MONDAY = 6;

// The start of this week in Tashkent, Monday 00:00 (docs/35): the cards are refreshed after it.
export function mondayStart(now: number): number {
  const today = tashkentDate(now);
  const sinceMonday = (new Date(today).getUTCDay() + FROM_MONDAY) % WEEK_DAYS;
  return tashkentDayStart(today) - sinceMonday * DAY_MS;
}
