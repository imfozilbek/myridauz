import { tashkentDate, type Trip } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { usePlaces } from '../market/places-gate';
import { returnDepartAt, returnTrip } from './return-plan';

// The way back from now (docs/40, G78 В11): today when it leaves by the brand's time, else the next
// morning, and the publishing of it; null while a place of the trip is unknown.
export function useReturnPlan(trip: Trip) {
  const directory = usePlaces();
  const rules = useBrand().schedule;
  const now = Date.now();
  const departAt = returnDepartAt(trip, now, rules);
  return { now, day: tashkentDate(departAt), departAt, back: returnTrip(trip, directory, departAt) };
}
