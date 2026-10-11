import { keepValue, keptValue } from '../screen/list-memory';

// What the driver chose in a sheet of a request (G77): «Назад» or a swipe closes the sheet, its next
// opening starts from the same time and price, never from the start.
type Draft = { readonly time: string; readonly price: number };
const key = (part: keyof Draft, requestId: string) => `offer.draft.${part}.${requestId}`;

export const draftOf = <P extends keyof Draft>(part: P, requestId: string): Draft[P] | undefined =>
  keptValue<Draft[P]>(key(part, requestId));

export const keepDraft = <P extends keyof Draft>(part: P, requestId: string, value: Draft[P]) =>
  keepValue(key(part, requestId), value);
