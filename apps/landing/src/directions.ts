import { FIRST_ROUTE, type MapData } from './map-data';

type City = MapData['cities'][number];

// A page of one direction (docs/60): people search "Toshkent Samarqand", so every direction
// from the capital and back has its own address.
export type Direction = { readonly from: City; readonly to: City; readonly path: string };

const direction = (from: City, to: City): Direction => ({
  from,
  to,
  path: `/yonalish/${from.id}-${to.id}/`,
});

// From the capital to every region center, then back: the main directions (docs/16).
export function directions(map: MapData): Direction[] {
  const hub = map.cities.find((city) => city.soato === FIRST_ROUTE.from);
  if (!hub) return [];
  const others = map.cities.filter((city) => city !== hub);
  return [...others.map((city) => direction(hub, city)), ...others.map((city) => direction(city, hub))];
}
