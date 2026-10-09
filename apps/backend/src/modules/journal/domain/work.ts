import { MINUTE_MS, teamWaitMs, type TeamHours } from '@platform/contracts';
import type { Action } from './action';

export type DayWork = { readonly done: number; readonly averageMinutes: number; readonly over: number };

// The day of a member (mockup g67/1): the cases decided, their average wait and how many waited over
// the limit, in team minutes like «Navbat» (G34). A change without a case counts as done only.
export function workOf(actions: readonly Action[], hours: TeamHours, limit: number): DayWork {
  const waits = actions.flatMap((action) =>
    action.since === null ? [] : [Math.floor(teamWaitMs(action.since, action.at, hours) / MINUTE_MS)],
  );
  const total = waits.reduce((sum, minutes) => sum + minutes, 0);
  return {
    done: actions.length,
    averageMinutes: waits.length === 0 ? 0 : Math.round(total / waits.length),
    over: waits.filter((minutes) => minutes > limit).length,
  };
}
