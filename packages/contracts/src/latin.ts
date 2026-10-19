// Uzbek Cyrillic, Russian and the Cyrillic of Karakalpak and Tajik names in the Uzbek Latin alphabet
// of docs/25: oʻ and gʻ with U+02BB, the tutuq sign with U+02BC. The names of the map that people
// read (G48, docs/100 F1) and the search key (G23) use this one table.
const OKINA = 'ʻ';
const TUTUQ = 'ʼ';

const LETTERS: Readonly<Record<string, string>> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: TUTUQ,
  ы: 'i',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: `o${OKINA}`,
  қ: 'q',
  ғ: `g${OKINA}`,
  ҳ: 'h',
  ә: 'a',
  ө: 'o',
  ү: 'u',
  ұ: 'u',
  ң: 'ng',
  і: 'i',
  һ: 'h',
  ҷ: 'j',
  ӣ: 'i',
  ӯ: 'u',
};
const VOWELS = new Set([...'аеёиоуэюяўыәөүұіaeiou']);
const SIGNS = new Set(['ъ', 'ь']);
// The apostrophes people type for oʻ, gʻ and the tutuq sign, once or twice.
const MARKS = /(\p{L})(['`‘’ʼʻ´]{1,2})/gu;
const LETTER = /\p{L}/u;

const isLetter = (char = '') => LETTER.test(char);
const isUpper = (char = '') => char !== char.toLowerCase();

// «е» is «ye» at the start of a word and after a vowel or a sign; «ц» is «ts» after a vowel.
function latinOf(chars: readonly string[], index: number): string | undefined {
  const lower = chars[index]?.toLowerCase() ?? '';
  const before = chars[index - 1]?.toLowerCase() ?? '';
  if (lower === 'е') return !isLetter(before) || VOWELS.has(before) || SIGNS.has(before) ? 'ye' : 'e';
  if (lower === 'ц') return VOWELS.has(before) ? 'ts' : 's';
  return LETTERS[lower];
}

// A capital becomes one capital, or all of them in a word written in capitals: «Ш» is «Sh» or «SH».
function cased(latin: string, chars: readonly string[], index: number): string {
  if (!isUpper(chars[index])) return latin;
  if (latin.length < 2) return latin.toUpperCase();
  const next = chars[index + 1];
  const capitals = isLetter(next) ? isUpper(next) : isUpper(chars[index - 1]);
  return capitals ? latin.toUpperCase() : `${latin.charAt(0).toUpperCase()}${latin.slice(1)}`;
}

// oʻ and gʻ before a letter (and gʻ at the end of a word, «togʻ»); the tutuq sign between letters.
function mended(text: string): string {
  return text.replace(MARKS, (match, letter: string, marks: string, offset: number) => {
    const og = /[og]/iu.test(letter);
    if (isLetter(text[offset + match.length])) return `${letter}${og ? OKINA : TUTUQ}`;
    return /g/iu.test(letter) && marks.length === 1 ? `${letter}${OKINA}` : match;
  });
}

export function toLatin(text: string): string {
  const chars = [...text];
  const latin = chars.map((char, index) => {
    const letters = latinOf(chars, index);
    return letters === undefined ? char : cased(letters, chars, index);
  });
  return mended(latin.join(''));
}
