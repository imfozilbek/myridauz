import type { BrandConfig } from './brand-config';

// The channel zone of a place: its own district or city first, then its region (docs/63).
export const channelOf = (brand: BrandConfig, ...places: readonly string[]) =>
  places.map((place) => brand.channels.find((zone) => zone.places.includes(place))).find(Boolean);
