import { searchKey } from './search-key';

// A place matches when one of its words starts with the query ("qarshi" finds "Qarshi shahri").
// The same key as the search on the map (docs/90 F-P3): «Самарканд», «Samarkand» and «Tashkent»
// find their places, and every way to type oʻ and gʻ means the same letter (docs/25).
export function matchesPlace(name: string, query: string): boolean {
  const needle = searchKey(query);
  if (needle === '') return true;
  const haystack = searchKey(name);
  return haystack.startsWith(needle) || haystack.includes(` ${needle}`);
}
