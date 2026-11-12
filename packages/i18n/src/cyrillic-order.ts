// The order of the Uzbek Cyrillic alphabet (docs/25): а … я, then ў, қ, ғ, ҳ. A list of places sorted by
// its Latin names reads at random once it is shown in Cyrillic (G98, lesson 392).
const ALPHABET = [...'абвгдеёжзийклмнопрстуфхцчшъьэюяўқғҳ'];
const RANK = new Map(ALPHABET.map((letter, at) => [letter, at]));
// A sign outside the alphabet (a space, a digit) goes before every letter, as in a dictionary.
const BEFORE_LETTERS = -1;

const rankOf = (letter: string) => RANK.get(letter) ?? BEFORE_LETTERS;

export function byCyrillic(one: string, other: string): number {
  const left = [...one.toLowerCase()];
  const right = [...other.toLowerCase()];
  for (let at = 0; at < Math.min(left.length, right.length); at += 1) {
    const difference = rankOf(left[at] ?? '') - rankOf(right[at] ?? '');
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}
