// Uzbek Latin into Uzbek Cyrillic at the last step (owner, 05.11.2026: «Да, кириллица»; docs/223):
// the texts stay written in Latin in the catalog, a card of a direction group is shown in Cyrillic,
// as the group's own cards. Kept as written: HTML marks, links, @names, /commands and the words the
// caller names (the brand, a car's model: owner, 25.10.2026, «Марки или модель машины только на
// english»).
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
const MARKS = String.raw`<[^>]*>|&#?\w+;|https?://[^\s<>]+|t\.me/[^\s<>]+|@\w+|(?<!\S)/[a-z_]+|\S+\.uz\b`;

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
  let out = SPECIAL[low] ?? '';
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

// A whole text: the kept pieces as they are, every other Latin word in Cyrillic.
export function toCyrillic(text: string, keep: readonly string[] = []): string {
  const words = keep.filter(Boolean).map(escaped);
  const kept = new RegExp(words.length > 0 ? `${MARKS}|\\b(?:${words.join('|')})\\b` : MARKS, 'gu');
  let out = '';
  let last = 0;
  for (const match of text.matchAll(kept)) {
    out += text.slice(last, match.index).replace(WORD, word) + match[0];
    last = match.index + match[0].length;
  }
  return out + text.slice(last).replace(WORD, word);
}
