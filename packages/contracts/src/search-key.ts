// The search key of a place name (G23, docs/67): one key for Uzbek Latin, Uzbek Cyrillic and
// Russian, so «Chilonzor», «Чилонзор» and «Чиланзар» find the same place. The key is only for
// matching: people always see the name as the map has it. Here, not in the backend: the index
// script and the Mini App (recent places) use the same key (G24).

// Uzbek Cyrillic and Russian letters in the Uzbek Latin alphabet (docs/25).
const CYRILLIC: Readonly<Record<string, string>> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
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
  ц: 's',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: '',
  ы: 'i',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
};

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
  const latin = [...text.replace(NUMBER_SIGN, ' ').toLowerCase()]
    .map((letter) => CYRILLIC[letter] ?? letter)
    .join('');
  const plain = latin.normalize('NFKD').replace(MARKS, '').replace(APOSTROPHES, '');
  const loose = LOOSE.reduce((word, [from, to]) => word.replace(from, to), plain.replace(NOT_WORD, ' '));
  const words = loose.replace(DOUBLE, '$1').trim().split(/ +/u);
  return words.map((word) => SAME_AS.get(word) ?? word).join(' ');
}
