import type { PlaceKind } from '@platform/contracts';

// The kind of a named thing in the Protomaps layers (G23, docs/67): only what a person can wait
// at and name to a driver. Shops, offices, water, rails and paths are left out: the index stays
// small (docs/61).
const POIS: Readonly<Record<string, PlaceKind>> = {
  residential: 'mahalla',
  marketplace: 'market',
  supermarket: 'market',
  mall: 'market',
  department_store: 'market',
  school: 'school',
  kindergarten: 'school',
  college: 'school',
  university: 'school',
  place_of_worship: 'mosque',
  hospital: 'health',
  clinic: 'health',
  doctors: 'health',
  dentist: 'health',
  pharmacy: 'health',
  bus_station: 'transport',
  bus_stop: 'transport',
  station: 'transport',
  fuel: 'place',
  cafe: 'place',
  restaurant: 'place',
  fast_food: 'place',
  bank: 'place',
  hotel: 'place',
  guest_house: 'place',
  police: 'place',
  post_office: 'place',
  townhall: 'place',
  administrative: 'place',
  attraction: 'place',
  memorial: 'place',
  park: 'place',
  stadium: 'place',
  sports_centre: 'place',
  community_centre: 'place',
  theatre: 'place',
  cinema: 'place',
  museum: 'place',
  library: 'place',
  zoo: 'place',
};
const PLACES: Readonly<Record<string, PlaceKind>> = {
  neighbourhood: 'mahalla',
  macrohood: 'mahalla',
  locality: 'settlement',
};
const STREETS = new Set(['highway', 'major_road', 'minor_road', 'other']);

export function placeKind(layer: string, kind: string): PlaceKind | null {
  if (layer === 'places') return PLACES[kind] ?? null;
  if (layer === 'roads') return STREETS.has(kind) ? 'street' : null;
  return layer === 'pois' ? (POIS[kind] ?? null) : null;
}
