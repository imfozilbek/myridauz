import { keepValue, keptValue } from '../screen/list-memory';

// What the driver chose in a sheet of a request (G77): «Назад» or a swipe closes the sheet, its next
// opening starts from the same time and price, never from the start.
type Draft = { readonly time: string; readonly price: number };
const key = (part: keyof Draft, requestId: string) => `offer.draft.${part}.${requestId}`;

export const draftOf = <P extends keyof Draft>(part: P, requestId: string): Draft[P] | undefined =>
  keptValue<Draft[P]>(key(part, requestId));

export const keepDraft = <P extends keyof Draft>(part: P, requestId: string, value: Draft[P]) =>
  keepValue(key(part, requestId), value);

// The time of the offer sent last: the sheet of the next request starts from it, where that day has
// it (G79 В13).
const LAST_TIME = 'offer.draft.time.last';
export const lastOfferTime = (): string | undefined => keptValue<string>(LAST_TIME);
export const keepOfferTime = (time: string) => keepValue(LAST_TIME, time);
