import type { BrandConfig } from './brand-config';

// The channel zone of a place: its own district or city first, then its region (docs/63).
export const channelOf = (brand: BrandConfig, ...places: readonly string[]) =>
  places.map((place) => brand.channels.find((zone) => zone.places.includes(place))).find(Boolean);

const REGION_DIGITS = 2;

// The zone of a driver by the region of the car plate (G62, docs/119): the code of a zone is the first
// number of the plate regions of its province; its first zone is the main one. Tashkent (01 … 09)
// has no channel (docs/15).
export function channelOfPlate(brand: BrandConfig, plate: string) {
  const region = Number(plate.slice(0, REGION_DIGITS));
  const codes = brand.channels.map((zone) => Number(zone.code)).filter((code) => code <= region);
  if (codes.length === 0) return undefined;
  const code = Math.max(...codes);
  return brand.channels.find((zone) => Number(zone.code) === code);
}
