// People type oʻ and gʻ in many ways: o' o` oʼ o‘ o’. All of them mean the same letter (docs/25).
const APOSTROPHES = /[ʻʼ'`‘’´]/g;
const SEARCH_APOSTROPHE = 'ʻ';

export function normalizeSearch(text: string): string {
  return text.toLocaleLowerCase('uz').replace(APOSTROPHES, SEARCH_APOSTROPHE).replace(/\s+/g, ' ').trim();
}

// A place matches when one of its words starts with the query ("qarshi" finds "Qarshi shahri").
export function matchesPlace(name: string, query: string): boolean {
  const needle = normalizeSearch(query);
  if (needle === '') return true;
  const haystack = normalizeSearch(name);
  return haystack.startsWith(needle) || haystack.includes(` ${needle}`);
}
