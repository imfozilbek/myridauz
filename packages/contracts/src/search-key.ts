// The search key of a place name (G23, docs/67): one key for Uzbek Latin, Uzbek Cyrillic and
// Russian, so «Chilonzor», «Чилонзор» and «Чиланзар» find the same place. The key is only for
// matching: people see the name in Uzbek Latin (latin.ts, G48). Here, not in the backend: the index
// script and the Mini App (recent places) use the same key (G24).

// «.ts»: the map script runs this file straight in node (G23).
import { toLatin } from './latin.ts';

// Sounds the two languages write differently: Russian «а» for Uzbek «o», «к» for «q», «х» for
// «x» and «h». Each pair becomes one letter.
const LOOSE: readonly (readonly [RegExp, string])[] = [
  [/kh|x/gu, 'h'],
  [/q/gu, 'k'],
  [/ts/gu, 's'],
  [/o/gu, 'a'],
  [/ye/gu, 'e'],
  [/w/gu, 'v'],
];

const MARKS = /\p{M}/gu;
// «№184»: the number sign would become the letters «no».
const NUMBER_SIGN = /№/gu;
const APOSTROPHES = /[ʻʼ'`‘’´]/gu;
const NOT_WORD = /[^a-z0-9]+/gu;
const DOUBLE = /([a-z])\1+/gu;

// Words people use for one thing (docs/69): each key of a group becomes the first one, in the
// index and in the query alike. «rynok» finds «Chorsu bozori», «kvartal» finds «9-mavze».
const SYNONYMS: readonly (readonly string[])[] = [
  ['mavze', 'kvartal', 'masiv'],
  ['bazar', 'rinak', 'rynak'],
  ['maktab', 'shkala'],
  ['bekat', 'astanavka'],
  ['shifahana', 'balnisa'],
  ['masjid', 'mechet'],
];
const SAME_AS = new Map(SYNONYMS.flatMap(([first = '', ...others]) => others.map((word) => [word, first])));

export function searchKey(text: string): string {
  const latin = toLatin(text.replace(NUMBER_SIGN, ' ').toLowerCase());
  const plain = latin.normalize('NFKD').replace(MARKS, '').replace(APOSTROPHES, '');
  const loose = LOOSE.reduce((word, [from, to]) => word.replace(from, to), plain.replace(NOT_WORD, ' '));
  const words = loose.replace(DOUBLE, '$1').trim().split(/ +/u);
  return words.map((word) => SAME_AS.get(word) ?? word).join(' ');
}
