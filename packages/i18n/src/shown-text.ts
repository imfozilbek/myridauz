import type { Locale } from './config';
import { toCyrillic } from './cyrillic';
import type { MessageValues } from './format-message';

// The values that name a place are shown in the alphabet of the text even when they were kept in
// Latin: an older trip, a name of the map or of the team (G98, docs/228). The names of people, the
// cars, the plates and the brand stay as they were written.
const PLACE_VALUES = new Set([
  'from',
  'to',
  'place',
  'route',
  'region',
  'area',
  'pitak',
  'city',
  'zone',
  'pickup',
  'drop',
  'direction',
]);

// The endings a text puts right after a value: «{name}ning», «{brand}ni». A name kept in Latin keeps
// them in Latin, one word in one alphabet: «Jasurning», «Ridani» (G98).
const ENDINGS: Readonly<Record<string, string>> = {
  нинг: 'ning',
  гача: 'gacha',
  дан: 'dan',
  да: 'da',
  ни: 'ni',
  га: 'ga',
  ка: 'ka',
  қа: 'qa',
};
const LATIN_STEM_ENDING = new RegExp(
  String.raw`(?<=[A-Za-z])(?:${Object.keys(ENDINGS).join('|')})(?!\p{Script=Cyrillic})`,
  'gu',
);

// A name of a place kept in Latin in the alphabet of the text.
export const placeIn = (locale: Locale, name: string): string =>
  locale === 'uz-Latn' ? name : toCyrillic(name);

export function shownValues(locale: Locale, values: MessageValues | undefined): MessageValues | undefined {
  if (locale === 'uz-Latn' || values === undefined) return values;
  const entries = Object.entries(values).map(([name, value]) => [
    name,
    typeof value === 'string' && PLACE_VALUES.has(name) ? placeIn(locale, value) : value,
  ]);
  return Object.fromEntries(entries) as MessageValues;
}

export const oneAlphabet = (locale: Locale, text: string): string =>
  locale === 'uz-Latn' ? text : text.replace(LATIN_STEM_ENDING, (ending) => ENDINGS[ending] ?? ending);
