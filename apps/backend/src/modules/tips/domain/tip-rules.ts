import { DAY_MS, isTeamTime, type TipStep } from '@platform/contracts';

// The rules of the tips of a step (docs/123 §3, docs/232): only 10:00 … 20:00 Tashkent, at most one tip a
// week for a person and two of one step.
const TIP_HOURS = { from: 10, to: 20 };
export const WEEK_MS = 7 * DAY_MS;
const MAX_OF_STEP = 2;

export const isTipTime = (now: number) => isTeamTime(now, TIP_HOURS);

// One tip in the journal (table tips).
export type Tip = { readonly userId: number; readonly step: TipStep; readonly sentAt: number };
type Stopped = { readonly userId: number; readonly step: TipStep };

// The passenger bot tells a passenger, the driver bot a driver.
export type TipBot = 'passenger' | 'driver';
export const botOf = (step: TipStep): TipBot => (step.startsWith('d') ? 'driver' : 'passenger');

// The people who stopped on a step and may hear its tip now, the first found first: one tip a person
// in a run, none in the week after the last one, none after two of the step.
export function pickTips<T extends Stopped>(
  stopped: readonly T[],
  journal: readonly Tip[],
  now: number,
): T[] {
  const picked: T[] = [];
  const told = new Set<number>();
  for (const candidate of stopped) {
    const own = journal.filter((tip) => tip.userId === candidate.userId);
    if (told.has(candidate.userId) || own.some((tip) => tip.sentAt > now - WEEK_MS)) continue;
    if (own.filter((tip) => tip.step === candidate.step).length >= MAX_OF_STEP) continue;
    told.add(candidate.userId);
    picked.push(candidate);
  }
  return picked;
}
