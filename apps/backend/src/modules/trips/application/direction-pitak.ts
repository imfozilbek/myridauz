import type { PickupMode, Pitak } from '@platform/contracts';
import { regionIn } from '../../../shared/places/place-match';
import type { TripsDeps } from './ports';

// The main pitak of the direction of a trip: the region of the start and of the end (docs/72).
export async function directionPitak(deps: TripsDeps, from: string, to: string): Promise<Pitak | null> {
  const regionOf = regionIn(await deps.places());
  return deps.pitakOf(regionOf(from), regionOf(to));
}

// The trip of an accepted offer takes any way the direction has: the pitak and the door, or only the
// door where there is no pitak (docs/70, G63).
export const offerWay = async (deps: TripsDeps, from: string, to: string): Promise<PickupMode> =>
  (await directionPitak(deps, from, to)) ? 'both' : 'door';
