import type { Trip } from '@platform/contracts';
import { usePlaces } from '../market/places-gate';
import { tomorrow } from '../market/when';
import { returnDepartAt, returnTripDraft } from './return-plan';

// The way back from today's point of view (docs/40): tomorrow, after the arrival and the rest, and
// the draft of the publishing for it; null while a place of the trip is unknown.
export function useReturnPlan(trip: Trip) {
  const directory = usePlaces();
  const now = Date.now();
  const day = tomorrow(now);
  const departAt = returnDepartAt(trip, day);
  return { now, day, departAt, draft: returnTripDraft(trip, directory, departAt) };
}
