import type { RideRequest } from '@platform/contracts';
import { usePlaces } from '../market/places-gate';
import { usePlaceNames } from '../places/place-names';

export type Ends = { readonly from: string; readonly to: string };

// «Chilonzor → Samarqand»: the ends of a request or a trip by their short names on a card (docs/121).
export function useEnds() {
  const directory = usePlaces();
  const { toward } = usePlaceNames(directory);
  const name = (id: string) => {
    const place = directory.find(id);
    return place ? toward(place) : '';
  };
  return (way: Pick<RideRequest, 'from' | 'to'>): Ends => ({ from: name(way.from), to: name(way.to) });
}
