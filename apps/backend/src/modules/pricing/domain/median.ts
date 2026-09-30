import { MEDIAN_MIN_TRIPS } from '@platform/contracts';

// The median of real prices: only a hint for the team, never the recommendation (docs/09).
// Fewer than MEDIAN_MIN_TRIPS trips say too little: null.
export function medianPrice(prices: readonly number[]): number | null {
  if (prices.length < MEDIAN_MIN_TRIPS) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 1 ? upper : Math.round(((sorted[middle - 1] ?? 0) + upper) / 2);
}

type Place = { readonly parentId: string | null };
type Priced = { readonly from: string; readonly to: string };

// A trip goes on a direction both ways; a region in the table covers its places (docs/23).
export function onDirection(trip: Priced, a: string, b: string, places: ReadonlyMap<string, Place>): boolean {
  const within = (placeId: string, id: string) => placeId === id || places.get(placeId)?.parentId === id;
  return (within(trip.from, a) && within(trip.to, b)) || (within(trip.from, b) && within(trip.to, a));
}
