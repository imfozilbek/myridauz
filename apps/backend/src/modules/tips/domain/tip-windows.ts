import { DAY_MS, HOUR_MS, type TipStep } from '@platform/contracts';
import { WEEK_MS } from './tip-rules';

// The moments a person stopped on a step, read by one run: [from, to). The tips go only by day, so a
// run reads the stops of a whole day before the delay of the step (docs/123 §3).
export type Window = { readonly from: number; readonly to: number };
const WINDOW_MS = DAY_MS;

// How long after the stop its tip comes (docs/232): registered and found nothing 24 h, opened a trip
// and booked nothing 3 h, a ride and no next one 14 days, a request without offers 6 h, a draft of an
// application 24 h, approved and no trip 48 h, no trip for 21 days.
const DELAY_MS: Readonly<Record<Exclude<TipStep, 'd7'>, number>> = {
  p2: DAY_MS,
  p3: 3 * HOUR_MS,
  p10: 14 * DAY_MS,
  req: 6 * HOUR_MS,
  d1: DAY_MS,
  d2: 2 * DAY_MS,
  d4: 21 * DAY_MS,
};
// A person still stopped on these a week later hears the second tip of the step; the others stop
// on one trip or request, gone by then.
const AGAIN: ReadonlySet<TipStep> = new Set(['p2', 'p10', 'd1', 'd2', 'd4']);

// D7: a trip without a booking 12 h before it leaves; the last 2 h are the driver's own.
const D7_BEFORE_MS = 12 * HOUR_MS;
const D7_LAST_MS = 2 * HOUR_MS;
// A trip published lately has had no time for a booking yet.
export const D7_PUBLISHED_MS = 3 * HOUR_MS;

// The windows of a step at `now`: of stops, and for D7 of departures.
export function windowsOf(step: TipStep, now: number): Window[] {
  if (step === 'd7') return [{ from: now + D7_LAST_MS, to: now + D7_BEFORE_MS }];
  const to = now - DELAY_MS[step];
  const first = { from: to - WINDOW_MS, to };
  return AGAIN.has(step) ? [first, { from: first.from - WEEK_MS, to: first.to - WEEK_MS }] : [first];
}
