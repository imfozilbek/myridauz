import { NUMBER_WORDS } from './number-words';

// Contacts never pass through the chat (docs/07): phones in any form, @usernames and links to
// messengers and social networks become «***». Sums, dates and times stay as they are.
export const MASK = '***';
export type Masked = { readonly text: string; readonly masked: boolean };

type Range = readonly [number, number];

const LINK =
  /(?:https?:\/\/|www\.)\S+|\b(?:t|telegram)\s*\.\s*me\b\S*|\b(?:wa\.me|whatsapp\.com|instagram\.com|facebook\.com|fb\.com|vk\.com|tiktok\.com|ok\.ru|imo\.im|viber\.com)\S*/giu;
const USERNAME = /@[\p{L}\p{N}_.]{3,}/gu;
// A date (02.10.2026) or a time (08:30) is never a phone, even next to other numbers.
const DATE_OR_TIME = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{1,2}:\d{2}\b/gu;
const TOKEN = /[\p{L}\p{N}'ʻʼ’`]+/gu;
const SEPARATOR = /^[\s\-.()+,]*$/u;
const APOSTROPHES = /['ʻʼ’`]/gu;

const PHONE_DIGITS = 9;
const SHORT_PHONE_DIGITS = 7;
const THOUSANDS_GROUP = 3;
const MAX_FIRST_GROUP = 3;
// "toʻqson" is two digits of a phone, "bir" is one.
const TENS_WORD_MIN_LENGTH = 5;

const matches = (pattern: RegExp, text: string): Range[] =>
  [...text.matchAll(pattern)].map((match) => [match.index, match.index + match[0].length] as const);
const inside = (ranges: readonly Range[], at: number) => ranges.some(([from, to]) => at >= from && at < to);

type Token = {
  readonly from: number;
  readonly to: number;
  readonly word: string | null;
  readonly digits: string;
};

function numericToken(match: RegExpMatchArray): Token | null {
  const value = match[0];
  const from = match.index ?? 0;
  if (/^\d+$/u.test(value)) return { from, to: from + value.length, word: null, digits: value };
  const word = value.toLowerCase().replace(APOSTROPHES, '');
  return NUMBER_WORDS.has(word) ? { from, to: from + value.length, word, digits: '' } : null;
}

// Numbers as people write prices: 1 500 000, 150 000.
const looksLikeSum = ([first, ...rest]: readonly Token[]) =>
  first !== undefined &&
  rest.length >= 1 &&
  first.digits.length <= MAX_FIRST_GROUP &&
  rest.every((token) => token.digits.length === THOUSANDS_GROUP);

function isPhone(run: readonly Token[]): boolean {
  if (run.some((token) => token.word !== null)) {
    const units = run.reduce(
      (sum, token) =>
        sum + (token.word === null ? token.digits.length : token.word.length >= TENS_WORD_MIN_LENGTH ? 2 : 1),
      0,
    );
    return units >= SHORT_PHONE_DIGITS;
  }
  const digits = run.reduce((sum, token) => sum + token.digits.length, 0);
  if (digits >= PHONE_DIGITS) return true;
  return digits >= SHORT_PHONE_DIGITS && !looksLikeSum(run);
}

// Runs of numbers and number words that stand next to each other, only separators between them.
function phoneRanges(text: string, protectedRanges: readonly Range[]): Range[] {
  const found: Range[] = [];
  let run: Token[] = [];
  const close = () => {
    const [first] = run;
    const last = run.at(-1);
    if (first && last && isPhone(run)) found.push([first.from, last.to]);
    run = [];
  };
  for (const match of text.matchAll(TOKEN)) {
    const token = numericToken(match);
    const previous = run.at(-1);
    if (!token || inside(protectedRanges, token.from)) {
      close();
      continue;
    }
    if (previous && !SEPARATOR.test(text.slice(previous.to, token.from))) close();
    run.push(token);
  }
  close();
  return found;
}

function merge(ranges: readonly Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [from, to] of sorted) {
    const last = merged.at(-1);
    if (last && from <= last[1]) last[1] = Math.max(last[1], to);
    else merged.push([from, to]);
  }
  return merged;
}

export function maskContacts(text: string): Masked {
  const direct = [...matches(LINK, text), ...matches(USERNAME, text)];
  const protectedRanges = [...direct, ...matches(DATE_OR_TIME, text)];
  const ranges = merge([...direct, ...phoneRanges(text, protectedRanges)]);
  if (ranges.length === 0) return { text, masked: false };
  let out = '';
  let at = 0;
  for (const [from, to] of ranges) {
    out += text.slice(at, from) + MASK;
    at = to;
  }
  return { text: out + text.slice(at), masked: true };
}
