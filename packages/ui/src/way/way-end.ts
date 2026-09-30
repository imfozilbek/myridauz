import { ROAD_FACTOR, type Location, type PickupMode, type PlaceName, type Point } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// The start or the end of a way (G24, docs/71): the district, the point and its name. A point is
// null only for a start by the pitak; the end is always a point at the door (docs/70).
export type WayEnd = {
  readonly place: Location;
  readonly point: Point | null;
  readonly name: PlaceName | null;
};
export type Way = { readonly from: WayEnd; readonly to: WayEnd; readonly mode: PickupMode };

// The km people see between two points: straight line with the road factor (docs/70).
export const ROAD_KM = ROAD_FACTOR;

// «Chorsu bozori yaqinida», «Qatortol mahallasi», or the district when nothing is known.
export function useNameText() {
  const { t } = useI18n();
  return (name: PlaceName | null, place: Location) => {
    if (!name) return place.name;
    return name.step === 'landmark' || name.step === 'settlement'
      ? t('way.near', { name: name.name })
      : name.name;
  };
}

export const regionOf = (end: WayEnd) => end.place.parentId ?? end.place.id;
// A district chosen from the list, without the map: its center stands for the point (docs/71).
export const centerOf = (place: Location): WayEnd => ({
  place,
  point: { lat: place.lat, lng: place.lng },
  name: { step: 'district', name: place.name },
});
