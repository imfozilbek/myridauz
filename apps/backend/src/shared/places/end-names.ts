import { bold, escapeHtml } from '../telegram/html';

type Place = { readonly name: string; readonly parentId: string | null };
export type Places = ReadonlyMap<string, Place>;

const regionOf = (id: string, places: Places) => places.get(id)?.parentId ?? id;
const nameOf = (id: string, places: Places) => places.get(id)?.name ?? id;

// How a name is written: the district and its region.
type Style = { readonly district: (name: string) => string; readonly region: (name: string) => string };
const HTML: Style = { district: (name) => bold(escapeHtml(name)), region: escapeHtml };
// Plain words for a link of t.me/share/url and a card without HTML (G88).
export const PLAIN: Style = { district: (name) => name, region: (name) => name };

// «<b>Chilonzor</b>, Toshkent shahri»: the district in bold and its region, never just «Toshkent»
// (docs/121). Both ends in one region: the region is said once, at the start.
export function endNames(
  from: string,
  to: string,
  places: Places,
  style: Style = HTML,
): { from: string; to: string } {
  const end = (id: string, withRegion: boolean) => {
    const region = regionOf(id, places);
    const district = style.district(nameOf(id, places));
    if (region === id || !withRegion) return district;
    return `${district}, ${style.region(nameOf(region, places))}`;
  };
  const sameRegion = regionOf(from, places) === regionOf(to, places);
  return { from: end(from, true), to: end(to, !sameRegion) };
}
