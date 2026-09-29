// A direction is stored once for both ways: a trip there and back shares its costs the same (docs/23).
export const orderedPair = (a: string, b: string): readonly [string, string] => (a < b ? [a, b] : [b, a]);

type Place = { readonly id: string; readonly parentId: string | null };

// Where to look for the team's price, the closest first: the two places, then their regions.
export function directionKeys(from: Place, to: Place): (readonly [string, string])[] {
  const keys = [orderedPair(from.id, to.id)];
  const regions = orderedPair(from.parentId ?? from.id, to.parentId ?? to.id);
  if (regions[0] !== keys[0]?.[0] || regions[1] !== keys[0]?.[1]) keys.push(regions);
  return keys;
}
