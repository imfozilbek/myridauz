import { bold, escapeHtml } from '../telegram/html';

type Place = { readonly name: string; readonly parentId: string | null };
export type Places = ReadonlyMap<string, Place>;

const regionOf = (id: string, places: Places) => places.get(id)?.parentId ?? id;
const nameOf = (id: string, places: Places) => escapeHtml(places.get(id)?.name ?? id);

// «<b>Chilonzor</b>, Toshkent shahri»: the district in bold and its region, never just «Toshkent»
// (docs/121). Both ends in one region: the region is said once, at the start.
export function endNames(from: string, to: string, places: Places): { from: string; to: string } {
  const end = (id: string, withRegion: boolean) => {
    const region = regionOf(id, places);
    if (region === id || !withRegion) return bold(nameOf(id, places));
    return `${bold(nameOf(id, places))}, ${nameOf(region, places)}`;
  };
  const sameRegion = regionOf(from, places) === regionOf(to, places);
  return { from: end(from, true), to: end(to, !sameRegion) };
}
