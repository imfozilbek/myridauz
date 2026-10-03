import type { Location, PlaceName, Point } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// The start or the end of a way (G24, docs/71): the district, the point and its name. A point is
// null only for a start by the pitak; the end is always a point at the door (docs/70).
export type WayEnd = {
  readonly place: Location;
  readonly point: Point | null;
  readonly name: PlaceName | null;
};

// «Chorsu bozori yaqinida», «Qatortol mahallasi», or the district (or any text) when nothing is known.
export function useNameText() {
  const { t } = useI18n();
  return (name: PlaceName | null, place: Location | string) => {
    if (!name) return typeof place === 'string' ? place : place.name;
    return name.step === 'landmark' || name.step === 'settlement'
      ? t('way.near', { name: name.name })
      : name.name;
  };
}

// A pitak joins two regions (docs/72): the region of a district, or the region itself.
export const regionOf = (place: Location) => place.parentId ?? place.id;
