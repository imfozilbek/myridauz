import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { toCyrillic } from './cyrillic';

type Span = { readonly start: number; readonly end: number };

// Where the words of a message are: the text between its {place}, inside the forms of plural and
// select, inside its tags.
function wordsOf(elements: readonly MessageFormatElement[]): Span[] {
  return elements.flatMap((element): Span[] => {
    if (element.type === TYPE.literal && element.location)
      return [{ start: element.location.start.offset, end: element.location.end.offset }];
    if (element.type === TYPE.plural || element.type === TYPE.select)
      return Object.values(element.options).flatMap((option) => wordsOf(option.value));
    if (element.type === TYPE.tag) return wordsOf(element.children);
    return [];
  });
}

// A message of the catalog in Cyrillic (G98, docs/228): only its words change; {place}, the forms of
// plural and select and their keys stay as they are, so it formats with the same values.
export function cyrillicMessage(latin: string): string {
  const spans = wordsOf(parse(latin, { captureLocation: true })).sort((a, b) => a.start - b.start);
  let out = '';
  let at = 0;
  for (const { start, end } of spans) {
    out += latin.slice(at, start) + toCyrillic(latin.slice(start, end));
    at = end;
  }
  return out + latin.slice(at);
}
