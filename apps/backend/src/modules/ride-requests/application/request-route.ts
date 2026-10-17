import type { Point, RideRequestData } from '@platform/contracts';
import { regionIn } from '../../../shared/places/place-match';
import type { RequestsDeps } from './ports';

// «Toshkent shahri» in one tap (G78 П9): the route of a request may start or end in a whole region,
// and its points tell the districts: the seat at the door or the pitak, and the drop off. A request
// keeps districts, like a trip: the price, the board of the drivers and the offers need them (lesson 309).
export async function routeByPoints(deps: RequestsDeps, input: RideRequestData): Promise<RideRequestData> {
  const places = await deps.places();
  const regionOf = regionIn(places);
  const pitak =
    input.pickupMode === 'pitak' ? await deps.pitakOf(regionOf(input.from), regionOf(input.to)) : null;
  const start = input.pickupMode === 'pitak' ? pitak?.point : input.pickup;
  const districtIn = (place: string, point: Point | null | undefined) => {
    if (places.get(place)?.parentId !== null || !point) return place;
    const district = deps.districtOf(point);
    return district !== null && regionOf(district) === place ? district : place;
  };
  return { ...input, from: districtIn(input.from, start), to: districtIn(input.to, input.dropoff) };
}
