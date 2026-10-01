import type { Point } from '@platform/contracts';
import places from '../../../../seed/locations.json' with { type: 'json' };
import { fitsPlace } from '../domain/place-fit';

// The names and the regions of districts and cities from the directory (docs/48): the last step
// of the ladder, the region of a pitak and the place a point of a trip may lie in (G24).
const byId = new Map(places.map((place) => [place.id, place]));
const parentOf = (id: string) => byId.get(id)?.parentId ?? null;
const oneCity = (id: string) => byId.get(id)?.oneCity === true;

export const districtName = (id: string) => byId.get(id)?.name;
export const regionOfDistrict = (id: string) => parentOf(id) ?? undefined;
export const isRegionId = (id: string) => byId.has(id) && parentOf(id) === null;
export const pointFits = (point: Point, district: string | null, placeId: string) =>
  fitsPlace(point, district, byId.get(placeId), oneCity, parentOf);
