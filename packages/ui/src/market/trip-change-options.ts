import { MINUTE_MS, tashkentDate, type Trip } from '@platform/contracts';

const STEP_MS = 15 * 60 * 1000;
const STEPS = 4;

// The later times a driver may choose (docs/104, 8): by 15 minutes, at most the brand's minutes (+1
// hour) from the first time in all, the same day. Nothing to choose: the time cannot move any more.
export function laterTimes(trip: Pick<Trip, 'departAt' | 'firstDepartAt'>, shiftMinutes: number): number[] {
  const shiftMs = shiftMinutes * MINUTE_MS;
  return Array.from(
    { length: Math.floor(shiftMs / STEP_MS) },
    (_, index) => trip.departAt + (index + 1) * STEP_MS,
  ).filter(
    (at) => at <= trip.firstDepartAt + shiftMs && tashkentDate(at) === tashkentDate(trip.firstDepartAt),
  );
}

// The lower prices (docs/104, 9): by the step of the route, not below its lower bound.
export const lowerPrices = (price: number, minPrice: number, roundStep: number): number[] =>
  Array.from({ length: STEPS }, (_, index) => price - (index + 1) * roundStep).filter(
    (lower) => lower >= minPrice,
  );
