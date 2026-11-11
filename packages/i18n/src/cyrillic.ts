import exceptions from '../locales/uz-Cyrl/exceptions.json' with { type: 'json' };
import kept from '../locales/uz-Cyrl/keep.json' with { type: 'json' };

// Uzbek Latin into Uzbek Cyrillic (owner, 05.11.2026: «Да, кириллица»; docs/223): first the cards of a
// direction group, then the whole product (owner, 11.11.2026; G98, docs/228). The texts stay written in
// Latin in the catalog. Kept as written: HTML marks, links, @names, /commands, plates, the words of
// keep.json (Telegram, iPhone …) with their endings and the words the caller names (the brand, a car's
// model: owner, 25.10.2026, «Марки или модель машины только на english»). The borrowed words the rules
// get wrong are in exceptions.json (a native speaker checks them, OPS-07).
const LETTERS: Readonly<Record<string, string>> = Object.fromEntries(
  [...'abdefghijklmnopqrstuvxyzcw'].map((latin, at) => [latin, 'абдефгҳижклмнопқрстувхйзсв'[at] ?? latin]),
);
const VOWELS = new Set([...'aeiouʻ']);
// The months whose Cyrillic has «я» the Latin does not show.
const SPECIAL: Readonly<Record<string, string>> = { sentabr: 'сентябр', oktabr: 'октябр' };
const PAIRS: readonly (readonly [string, string])[] = [
  ['yoʻ', 'йў'],
  ['oʻ', 'ў'],
  ['gʻ', 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
];
// «ц» of a borrowed word (konditsioner, politsiya); a verb's «t» and its ending «sa», «sin» stay «тс».
const TS = /^ts(?:i[aeiouy]|e)/u;
const WORD = /[A-Za-zʻʼ]+/gu;
// A plate as Uzbekistan writes it: «01 A 123 BC», «01 123 ABC».
const PLATE = String.raw`\b\d{2} (?:[A-Z] \d{3} [A-Z]{2}|\d{3} [A-Z]{3})\b`;
const MARKS = String.raw`<[^>]*>|&#?\w+;|https?://[^\s<>]*|t\.me/[^\s<>]*|@\w+|(?<!\S)/[a-z_]+|\S+\.uz\b|${PLATE}`;
const OWN: Readonly<Record<string, string>> = exceptions;

const escaped = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

// One letter or a pair of them at `at`: the Cyrillic and how many Latin letters it took.
function letterAt(low: string, at: number): readonly [string, number] {
  const start = at === 0;
  if (low.startsWith('ts', at) && (start || TS.test(low.slice(at)))) return ['ц', 2];
  const pair = PAIRS.find(([latin]) => low.startsWith(latin, at));
  if (pair) return [pair[1], pair[0].length];
  if (low.startsWith('ye', at) && (start || VOWELS.has(low[at - 1] ?? ''))) return ['е', 2];
  const letter = low[at] ?? '';
  if (letter === 'e' && start) return ['э', 1];
  if (letter === 'ʼ') return ['ъ', 1];
  if (letter === 'ʻ') return ['', 1];
  return [LETTERS[letter] ?? letter, 1];
}

// «Yakkabogʻ» Яккабоғ, «BOʻSH» БЎШ: the case as written.
function word(latin: string): string {
  const low = latin.toLowerCase();
  const own = OWN[low];
  // «МЧЖ»: an exception with capitals is written as it is.
  if (own !== undefined && own !== own.toLowerCase()) return own;
  let out = own ?? SPECIAL[low] ?? '';
  for (let at = out ? low.length : 0; at < low.length;) {
    const [cyrillic, took] = letterAt(low, at);
    out += cyrillic;
    at += took;
  }
  const upper = latin.length > 1 && latin === latin.toUpperCase();
  if (upper) return out.toUpperCase();
  const capital = latin.charAt(0) !== latin.charAt(0).toLowerCase();
  return capital ? `${out.charAt(0).toUpperCase()}${out.slice(1)}` : out;
}

// What stays as written; «Telegramda»: a kept word keeps its ending too. Made once per list of words:
// the whole catalog goes through here (G98).
const MADE = new Map<string, RegExp>();
function marksOf(keep: readonly string[]): RegExp {
  const words = [...kept, ...keep.filter(Boolean)];
  const id = words.join('|');
  const made = MADE.get(id) ?? new RegExp(`${MARKS}|\\b(?:${words.map(escaped).join('|')})[a-zʻʼ]*\\b`, 'gu');
  MADE.set(id, made);
  return made;
}

// A whole text: the kept pieces as they are, every other Latin word in Cyrillic.
export function toCyrillic(text: string, keep: readonly string[] = []): string {
  const marks = marksOf(keep);
  let out = '';
  let last = 0;
  for (const match of text.matchAll(marks)) {
    out += text.slice(last, match.index).replace(WORD, word) + match[0];
    last = match.index + match[0].length;
  }
  return out + text.slice(last).replace(WORD, word);
}
