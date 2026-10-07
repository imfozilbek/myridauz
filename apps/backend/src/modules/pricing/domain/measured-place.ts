import type { Location } from '@platform/contracts';

type Place = Pick<Location, 'id' | 'parentId' | 'lat' | 'lng'>;

// The km of a direction to a whole region (G59, «Qayerga borasiz?»): a region is measured from its
// place nearest to its center (Samarqand viloyati: Samarqand shahri). Other places are measured as is.
export function measuredPlace(id: string, places: ReadonlyMap<string, Place>): string {
  const region = places.get(id);
  if (!region || region.parentId !== null) return id;
  const away = (place: Place) => (place.lat - region.lat) ** 2 + (place.lng - region.lng) ** 2;
  let nearest: Place | undefined;
  for (const place of places.values())
    if (place.parentId === id && (!nearest || away(place) < away(nearest))) nearest = place;
  return nearest?.id ?? id;
}
