import { tashkentTime } from '@platform/contracts';

// The part of the day a person chooses in the results (G41, docs/109 X1): the hours by Tashkent.
export const DAY_PARTS = ['any', 'morning', 'day', 'evening'] as const;
export type DayPart = (typeof DAY_PARTS)[number];

const MORNING_FROM = 5;
const DAY_FROM = 12;
const EVENING_FROM = 17;

function partOf(departAt: number): DayPart {
  const hour = Number(tashkentTime(departAt).slice(0, 2));
  if (hour >= EVENING_FROM || hour < MORNING_FROM) return 'evening';
  return hour >= DAY_FROM ? 'day' : 'morning';
}

export const inDayPart = (part: DayPart, departAt: number) => part === 'any' || partOf(departAt) === part;
